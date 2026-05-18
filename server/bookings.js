import { createBooking, getService, getTimeSlots } from '../src/booking.js';
import { readBookings, writeBookings } from './storage.js';
import { sendBookingEmails } from './email.js';

function normalizeBooking(input) {
  return {
    serviceId: input.serviceId,
    stylistId: input.stylistId,
    date: input.date,
    time: input.time,
    protection: Boolean(input.protection),
    productId: input.productId || 'none',
    status: 'confirmed',
    source: input.source || 'client',
    client: {
      name: String(input.client?.name || '').trim(),
      phone: String(input.client?.phone || '').trim(),
      email: String(input.client?.email || '').trim().toLowerCase(),
      notes: String(input.client?.notes || '').trim(),
    },
  };
}

function validateBooking(booking) {
  const service = getService(booking.serviceId);
  const errors = [];

  if (!service) errors.push('Serviciul nu exista.');
  if (!booking.stylistId) errors.push('Alege un specialist.');
  if (!booking.date) errors.push('Alege data.');
  if (!booking.time) errors.push('Alege ora.');
  if (!booking.client.name) errors.push('Numele este obligatoriu.');
  if (!booking.client.phone) errors.push('Telefonul este obligatoriu.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.client.email)) errors.push('Emailul nu este valid.');
  if (service && !service.staffIds.includes(booking.stylistId)) errors.push('Specialistul nu poate face serviciul ales.');

  return errors;
}

export async function listBookings() {
  const bookings = await readBookings();
  return bookings.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

export async function reserveBooking(input) {
  const normalized = normalizeBooking(input);
  const errors = validateBooking(normalized);
  if (errors.length) {
    const error = new Error(errors.join(' '));
    error.statusCode = 400;
    throw error;
  }

  const service = getService(normalized.serviceId);
  const bookings = await readBookings();
  const availableSlot = getTimeSlots(normalized.date, service.duration, bookings, normalized.stylistId).find(
    (slot) => slot.time === normalized.time
  );

  if (!availableSlot?.available) {
    const error = new Error('Ora aleasa nu mai este disponibila.');
    error.statusCode = 409;
    throw error;
  }

  const booking = createBooking(normalized);
  const updated = [booking, ...bookings];
  await writeBookings(updated);
  const email = await sendBookingEmails(booking);

  return { booking, email };
}

export async function updateBookingStatus(id, status) {
  const allowed = new Set(['confirmed', 'completed', 'cancelled', 'no-show']);
  if (!allowed.has(status)) {
    const error = new Error('Status invalid.');
    error.statusCode = 400;
    throw error;
  }

  const bookings = await readBookings();
  const updated = bookings.map((booking) => (booking.id === id ? { ...booking, status } : booking));
  if (!updated.some((booking) => booking.id === id)) {
    const error = new Error('Programarea nu exista.');
    error.statusCode = 404;
    throw error;
  }

  await writeBookings(updated);
  return updated.find((booking) => booking.id === id);
}

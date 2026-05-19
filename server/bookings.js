import { createBooking, getBookingTotal, getService, getTimeSlots } from '../src/booking.js';
import { readBookings, writeBookings } from './storage.js';
import { sendBookingEmails, sendBookingReminderEmail } from './email.js';

function emailStatusFromResult(email) {
  if (email?.sent) {
    return {
      state: 'sent',
      label: 'Email trimis',
      lastAttemptAt: new Date().toISOString(),
      details: email.results || [],
    };
  }

  if (email?.skipped) {
    return {
      state: 'not-configured',
      label: 'Resend neconfigurat',
      lastAttemptAt: new Date().toISOString(),
      reason: email.reason,
    };
  }

  return {
    state: 'failed',
    label: 'Email esuat',
    lastAttemptAt: new Date().toISOString(),
    details: email?.results || [],
  };
}

function normalizeBooking(input) {
  const paymentMethod = input.payment?.method || input.paymentMethod || 'salon';
  const normalizedPaymentMethod = ['salon', 'card-demo', 'deposit'].includes(paymentMethod) ? paymentMethod : 'salon';

  return {
    serviceId: input.serviceId,
    stylistId: input.stylistId,
    date: input.date,
    time: input.time,
    protection: Boolean(input.protection),
    productId: input.productId || 'none',
    status: 'confirmed',
    source: input.source || 'client',
    payment: {
      method: normalizedPaymentMethod,
      status: normalizedPaymentMethod === 'card-demo' ? 'paid-demo' : 'pending',
    },
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

export async function listClientBookings(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    const error = new Error('Emailul nu este valid.');
    error.statusCode = 400;
    throw error;
  }

  const bookings = await readBookings();
  return bookings
    .filter((booking) => booking.client?.email === cleanEmail)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
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
  booking.payment = {
    ...booking.payment,
    amount: getBookingTotal(booking),
  };
  const updated = [booking, ...bookings];
  await writeBookings(updated);
  let email;

  try {
    email = await sendBookingEmails(booking);
  } catch (error) {
    email = { sent: false, results: [{ ok: false, error: error.message }] };
  }

  const bookingWithEmail = {
    ...booking,
    emailStatus: emailStatusFromResult(email),
  };

  await writeBookings([bookingWithEmail, ...bookings]);

  return { booking: bookingWithEmail, email };
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

export async function resendBookingEmail(id) {
  const bookings = await readBookings();
  const booking = bookings.find((item) => item.id === id);

  if (!booking) {
    const error = new Error('Programarea nu exista.');
    error.statusCode = 404;
    throw error;
  }

  let email;
  try {
    email = await sendBookingEmails(booking);
  } catch (error) {
    email = { sent: false, results: [{ ok: false, error: error.message }] };
  }

  const updatedBooking = {
    ...booking,
    emailStatus: emailStatusFromResult(email),
  };
  const updated = bookings.map((item) => (item.id === id ? updatedBooking : item));
  await writeBookings(updated);

  return { booking: updatedBooking, email };
}

export async function sendBookingReminder(id) {
  const bookings = await readBookings();
  const booking = bookings.find((item) => item.id === id);

  if (!booking) {
    const error = new Error('Programarea nu exista.');
    error.statusCode = 404;
    throw error;
  }

  let reminder;
  try {
    reminder = await sendBookingReminderEmail(booking);
  } catch (error) {
    reminder = { sent: false, results: [{ ok: false, error: error.message }] };
  }

  const updatedBooking = {
    ...booking,
    reminderStatus: {
      state: reminder?.sent ? 'sent' : reminder?.skipped ? 'not-configured' : 'failed',
      label: reminder?.sent ? 'Reminder trimis' : reminder?.skipped ? 'Resend neconfigurat' : 'Reminder esuat',
      lastAttemptAt: new Date().toISOString(),
      reason: reminder?.reason,
      details: reminder?.results || [],
    },
  };
  const updated = bookings.map((item) => (item.id === id ? updatedBooking : item));
  await writeBookings(updated);

  return { booking: updatedBooking, reminder };
}

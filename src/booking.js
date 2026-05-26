import { openingHours, products, seededBookings, services, stylists } from './data.js';

const STORAGE_KEY = 'blacksilva-bookings-v1';

const pad = (value) => String(value).padStart(2, '0');

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function displayDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function displayLongDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatMoney(amount) {
  return `${amount.toLocaleString('da-DK')} kr`;
}

export function getService(id) {
  return services.find((service) => service.id === id);
}

export function getStylist(id) {
  return stylists.find((stylist) => stylist.id === id);
}

export function getProduct(id) {
  return products.find((product) => product.id === id);
}

export function getShopProducts() {
  return products.filter((product) => product.id !== 'none');
}

export function getNextOpenDays(count = 14) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; days.length < count && offset < 35; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const schedule = openingHours[date.getDay()];
    if (schedule) {
      days.push({
        key: toDateKey(date),
        day: schedule.label,
        short: displayDate(toDateKey(date)),
        schedule,
      });
    }
  }

  return days;
}

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function getTimeSlots(dateKey, serviceDuration = 45, bookings = [], stylistId = '') {
  const date = new Date(`${dateKey}T12:00:00`);
  const schedule = openingHours[date.getDay()];
  if (!schedule) return [];

  const start = toMinutes(schedule.start);
  const end = toMinutes(schedule.end);
  const slots = [];
  const now = new Date();
  const todayKey = toDateKey(now);

  for (let minutes = start; minutes + serviceDuration <= end; minutes += 30) {
    const time = toTime(minutes);
    const isPastToday = dateKey === todayKey && minutes <= now.getHours() * 60 + now.getMinutes() + 60;
    const blocked = bookings.some(
      (booking) =>
        booking.date === dateKey &&
        booking.time === time &&
        (!stylistId || booking.stylistId === stylistId)
    );
    slots.push({ time, available: !blocked && !isPastToday });
  }

  return slots;
}

export function buildDemoBookings() {
  const days = getNextOpenDays(4);
  return seededBookings.map((booking, index) => ({
    ...booking,
    date: days[index + 1]?.key || days[0]?.key || toDateKey(new Date()),
  }));
}

export function loadBookings() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    return buildDemoBookings();
  }

  const initial = buildDemoBookings();
  saveBookings(initial);
  return initial;
}

export function saveBookings(bookings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function clearBookings() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function createBooking(selection) {
  return {
    id: `BS-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    ...selection,
  };
}

export function getBookingTotal(selection) {
  const service = getService(selection.serviceId);
  const product = getProduct(selection.productId);
  const protectionPrice = selection.protection && selection.serviceId !== 'booking-protection' ? 59 : 0;
  return (service?.price || 0) + protectionPrice + (product?.price || 0);
}

export function buildCalendarUrl(booking) {
  const service = getService(booking.serviceId);
  const stylist = getStylist(booking.stylistId);
  const start = new Date(`${booking.date}T${booking.time}:00`);
  const end = new Date(start.getTime() + (service?.duration || 45) * 60 * 1000);
  const stamp = (date) =>
    date.toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}Z$/, 'Z');
  const text = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `UID:${booking.id}@blacksilva`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:BlackSilva - ${service?.name || 'Booking'}`,
    `DESCRIPTION:With ${stylist?.name || 'BlackSilva'}. Booking ${booking.id}.`,
    'LOCATION:Badstuestraede 16, 1053 Kobenhavn',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:BlackSilva reminder - your appointment starts in one hour',
    'TRIGGER:-PT1H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
  return `data:text/calendar;charset=utf8,${encodeURIComponent(text)}`;
}

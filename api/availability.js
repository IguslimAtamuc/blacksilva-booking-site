import { listBookings } from '../server/bookings.js';

export default async function handler(_req, res) {
  try {
    const bookings = await listBookings();
    const availability = bookings
      .filter((booking) => booking.status !== 'cancelled')
      .map((booking) => ({
        id: booking.id,
        serviceId: booking.serviceId,
        stylistId: booking.stylistId,
        date: booking.date,
        time: booking.time,
        status: booking.status,
      }));
    res.status(200).json({ ok: true, bookings: availability });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || 'Something went wrong.' });
  }
}

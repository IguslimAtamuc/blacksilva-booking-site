import { listClientBookings } from '../server/bookings.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      res.status(405).json({ ok: false, message: 'Method not allowed' });
      return;
    }

    const bookings = await listClientBookings(req.query.email);
    res.status(200).json({ ok: true, bookings });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || 'Something went wrong.',
    });
  }
}

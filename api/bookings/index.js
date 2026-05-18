import { listBookings, reserveBooking } from '../../server/bookings.js';

function isAdminAuthorized(req) {
  if (!process.env.ADMIN_ACCESS_CODE) return true;
  return req.headers['x-admin-code'] === process.env.ADMIN_ACCESS_CODE;
}

function sendError(res, error) {
  res.status(error.statusCode || 500).json({
    ok: false,
    message: error.message || 'A aparut o eroare.',
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (!isAdminAuthorized(req)) {
        res.status(401).json({ ok: false, message: 'Admin code required.' });
        return;
      }
      const bookings = await listBookings();
      res.status(200).json({ ok: true, bookings });
      return;
    }

    if (req.method === 'POST') {
      const result = await reserveBooking(req.body || {});
      res.status(201).json({ ok: true, ...result });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ ok: false, message: 'Method not allowed' });
  } catch (error) {
    sendError(res, error);
  }
}

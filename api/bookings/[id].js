import { updateBookingStatus } from '../../server/bookings.js';

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
    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'PATCH');
      res.status(405).json({ ok: false, message: 'Method not allowed' });
      return;
    }

    if (!isAdminAuthorized(req)) {
      res.status(401).json({ ok: false, message: 'Admin code required.' });
      return;
    }

    const id = req.query.id;
    const booking = await updateBookingStatus(id, req.body?.status);
    res.status(200).json({ ok: true, booking });
  } catch (error) {
    sendError(res, error);
  }
}

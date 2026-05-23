import { resendBookingEmail, sendBookingReminder, updateBookingStatus } from '../../server/bookings.js';

function isAdminAuthorized(req) {
  if (!process.env.ADMIN_ACCESS_CODE) return true;
  return req.headers['x-admin-code'] === process.env.ADMIN_ACCESS_CODE;
}

function sendError(res, error) {
  res.status(error.statusCode || 500).json({
    ok: false,
    message: error.message || 'Something went wrong.',
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'PATCH' && req.method !== 'POST') {
      res.setHeader('Allow', 'PATCH, POST');
      res.status(405).json({ ok: false, message: 'Method not allowed' });
      return;
    }

    if (!isAdminAuthorized(req)) {
      res.status(401).json({ ok: false, message: 'Admin code required.' });
      return;
    }

    const id = req.query.id;

    if (req.method === 'POST') {
      if (req.body?.action === 'send-email') {
        const result = await resendBookingEmail(id);
        res.status(200).json({ ok: true, ...result });
        return;
      }

      if (req.body?.action === 'send-reminder') {
        const result = await sendBookingReminder(id);
        res.status(200).json({ ok: true, ...result });
        return;
      }

      res.status(400).json({ ok: false, message: 'Invalid action.' });
      return;
    }

    const booking = await updateBookingStatus(id, req.body?.status);
    res.status(200).json({ ok: true, booking });
  } catch (error) {
    sendError(res, error);
  }
}

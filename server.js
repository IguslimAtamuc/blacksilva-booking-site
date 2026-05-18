import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listBookings, reserveBooking, updateBookingStatus } from './server/bookings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 4173);

app.use(express.json());

function isAdminAuthorized(req) {
  if (!process.env.ADMIN_ACCESS_CODE) return true;
  return req.headers['x-admin-code'] === process.env.ADMIN_ACCESS_CODE;
}

app.get('/api/bookings', async (_req, res) => {
  try {
    if (!isAdminAuthorized(_req)) {
      res.status(401).json({ ok: false, message: 'Admin code required.' });
      return;
    }
    res.json({ ok: true, bookings: await listBookings() });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message });
  }
});

app.get('/api/availability', async (_req, res) => {
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
    res.json({ ok: true, bookings: availability });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const result = await reserveBooking(req.body || {});
    res.status(201).json({ ok: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message });
  }
});

app.patch('/api/bookings/:id', async (req, res) => {
  try {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ ok: false, message: 'Admin code required.' });
      return;
    }
    const booking = await updateBookingStatus(req.params.id, req.body?.status);
    res.json({ ok: true, booking });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
  console.log(`BlackSilva server running on http://127.0.0.1:${port}`);
});

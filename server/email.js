import { Resend } from 'resend';
import { formatMoney, getBookingTotal, getProduct, getService, getStylist, displayLongDate } from '../src/booking.js';
import { salon } from '../src/data.js';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function invoiceRow(label, amount) {
  return `
    <tr>
      <td style="padding:9px 0;color:#d8d0c3">${escapeHtml(label)}</td>
      <td style="padding:9px 0;text-align:right;color:#f7efe2">${formatMoney(amount)}</td>
    </tr>
  `;
}

function bookingEmailHtml(booking, variant = 'confirmation') {
  const service = getService(booking.serviceId);
  const stylist = getStylist(booking.stylistId);
  const product = getProduct(booking.productId);
  const total = getBookingTotal(booking);
  const isReminder = variant === 'reminder';
  const invoiceDate = booking.createdAt ? new Date(booking.createdAt) : new Date();
  const invoiceRows = [
    service ? invoiceRow(service.name, service.price || 0) : '',
    booking.protection ? invoiceRow('Booking Protection', 59) : '',
    product?.price ? invoiceRow(product.name, product.price) : '',
  ].join('');
  const title = isReminder ? 'Reminder: your appointment is coming soon.' : 'Your booking is confirmed.';
  const intro = isReminder
    ? `Hi ${escapeHtml(booking.client.name)}, this is a reminder for your BlackSilva appointment.`
    : `Hi ${escapeHtml(booking.client.name)}, your booking was registered successfully. Your confirmation and invoice summary are below.`;
  const paymentLabel =
    booking.payment?.method === 'card-demo'
      ? 'Card demo'
      : booking.payment?.method === 'deposit'
        ? 'Deposit / Stripe ready'
        : 'Pay at the salon';

  return `
    <div style="background:#050505;color:#f7efe2;font-family:Arial,sans-serif;padding:28px">
      <div style="max-width:560px;margin:auto;border:1px solid rgba(214,180,110,.35);padding:28px;background:#0d0c0a">
        <p style="color:#d6b46e;letter-spacing:.18em;text-transform:uppercase;font-size:11px;margin:0 0 16px">BlackSilva booking</p>
        <h1 style="font-family:Georgia,serif;font-weight:400;font-size:36px;line-height:1;margin:0 0 16px">${title}</h1>
        <p style="color:#d8d0c3;line-height:1.6;margin:0 0 22px">${intro}</p>
        <table style="width:100%;border-collapse:collapse;color:#f7efe2">
          <tr><td style="padding:10px 0;color:#9e9587">Code</td><td style="padding:10px 0;text-align:right">${escapeHtml(booking.id)}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Service</td><td style="padding:10px 0;text-align:right">${escapeHtml(service?.name)}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Specialist</td><td style="padding:10px 0;text-align:right">${escapeHtml(stylist?.name)}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Date</td><td style="padding:10px 0;text-align:right">${escapeHtml(displayLongDate(booking.date))}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Time</td><td style="padding:10px 0;text-align:right">${escapeHtml(booking.time)}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Location</td><td style="padding:10px 0;text-align:right">${escapeHtml(salon.address)}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Extra</td><td style="padding:10px 0;text-align:right">${booking.protection ? 'Booking Protection' : 'No protection'}${product?.price ? ` + ${escapeHtml(product.name)}` : ''}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Payment</td><td style="padding:10px 0;text-align:right">${escapeHtml(paymentLabel)}</td></tr>
          <tr><td style="padding:14px 0;color:#d6b46e;border-top:1px solid rgba(214,180,110,.25)">Estimated total</td><td style="padding:14px 0;text-align:right;color:#f3db9b;border-top:1px solid rgba(214,180,110,.25)">${formatMoney(total)}</td></tr>
        </table>
        <div style="margin-top:24px;border:1px solid rgba(214,180,110,.22);padding:18px;background:#080807">
          <p style="color:#d6b46e;letter-spacing:.16em;text-transform:uppercase;font-size:10px;margin:0 0 12px">Invoice summary</p>
          <table style="width:100%;border-collapse:collapse;color:#f7efe2">
            <tr><td style="padding:8px 0;color:#9e9587">Invoice no.</td><td style="padding:8px 0;text-align:right">${escapeHtml(booking.id)}</td></tr>
            <tr><td style="padding:8px 0;color:#9e9587">Invoice date</td><td style="padding:8px 0;text-align:right">${escapeHtml(invoiceDate.toLocaleDateString('en-GB'))}</td></tr>
            ${invoiceRows}
            <tr><td style="padding:12px 0 0;color:#d6b46e;border-top:1px solid rgba(214,180,110,.25)">Total</td><td style="padding:12px 0 0;text-align:right;color:#f3db9b;border-top:1px solid rgba(214,180,110,.25);font-size:20px">${formatMoney(total)}</td></tr>
          </table>
        </div>
        <p style="color:#d8d0c3;line-height:1.6;margin:22px 0 0">Address: ${escapeHtml(salon.address)}. Payment is made at the salon, and the final price may vary after consultation.</p>
        <p style="margin:18px 0 0">
          <a href="${escapeHtml(salon.mapsUrl)}" style="display:inline-block;color:#050505;background:#f3db9b;text-decoration:none;padding:12px 16px;border-radius:0;font-weight:700">Open location</a>
        </p>
      </div>
    </div>
  `;
}

export async function sendBookingEmails(booking) {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, skipped: true, reason: 'RESEND_API_KEY missing' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM || 'BlackSilva <onboarding@resend.dev>';
  const adminEmail = process.env.ADMIN_EMAIL || salon.email;
  const html = bookingEmailHtml(booking);

  const recipients = [
    {
      to: booking.client.email,
      subject: `BlackSilva booking confirmed - ${booking.id}`,
    },
    {
      to: adminEmail,
      subject: `New BlackSilva booking - ${booking.id}`,
    },
  ];

  const results = [];

  for (const recipient of recipients) {
    const { data, error } = await resend.emails.send({
      from,
      to: recipient.to,
      subject: recipient.subject,
      html,
      replyTo: booking.client.email,
    });

    if (error) {
      results.push({ to: recipient.to, ok: false, error });
    } else {
      results.push({ to: recipient.to, ok: true, id: data?.id });
    }
  }

  return {
    sent: results.some((result) => result.ok),
    results,
  };
}

export async function sendBookingReminderEmail(booking) {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, skipped: true, reason: 'RESEND_API_KEY missing' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM || 'BlackSilva <onboarding@resend.dev>';
  const html = bookingEmailHtml(booking, 'reminder');
  const { data, error } = await resend.emails.send({
    from,
    to: booking.client.email,
    subject: `Reminder BlackSilva - ${booking.id}`,
    html,
    replyTo: process.env.ADMIN_EMAIL || salon.email,
  });

  if (error) return { sent: false, results: [{ to: booking.client.email, ok: false, error }] };
  return { sent: true, results: [{ to: booking.client.email, ok: true, id: data?.id }] };
}

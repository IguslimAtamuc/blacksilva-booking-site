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

function bookingEmailHtml(booking) {
  const service = getService(booking.serviceId);
  const stylist = getStylist(booking.stylistId);
  const product = getProduct(booking.productId);
  const total = getBookingTotal(booking);

  return `
    <div style="background:#050505;color:#f7efe2;font-family:Arial,sans-serif;padding:28px">
      <div style="max-width:560px;margin:auto;border:1px solid rgba(214,180,110,.35);padding:28px;background:#0d0c0a">
        <p style="color:#d6b46e;letter-spacing:.18em;text-transform:uppercase;font-size:11px;margin:0 0 16px">BlackSilva booking</p>
        <h1 style="font-family:Georgia,serif;font-weight:400;font-size:36px;line-height:1;margin:0 0 16px">Programarea ta este confirmata.</h1>
        <p style="color:#d8d0c3;line-height:1.6;margin:0 0 22px">Salut ${escapeHtml(booking.client.name)}, rezervarea ta a fost inregistrata cu succes.</p>
        <table style="width:100%;border-collapse:collapse;color:#f7efe2">
          <tr><td style="padding:10px 0;color:#9e9587">Cod</td><td style="padding:10px 0;text-align:right">${escapeHtml(booking.id)}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Serviciu</td><td style="padding:10px 0;text-align:right">${escapeHtml(service?.name)}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Specialist</td><td style="padding:10px 0;text-align:right">${escapeHtml(stylist?.name)}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Data</td><td style="padding:10px 0;text-align:right">${escapeHtml(displayLongDate(booking.date))}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Ora</td><td style="padding:10px 0;text-align:right">${escapeHtml(booking.time)}</td></tr>
          <tr><td style="padding:10px 0;color:#9e9587">Extra</td><td style="padding:10px 0;text-align:right">${booking.protection ? 'Booking Protection' : 'Fara protectie'}${product?.price ? ` + ${escapeHtml(product.name)}` : ''}</td></tr>
          <tr><td style="padding:14px 0;color:#d6b46e;border-top:1px solid rgba(214,180,110,.25)">Total estimat</td><td style="padding:14px 0;text-align:right;color:#f3db9b;border-top:1px solid rgba(214,180,110,.25)">${formatMoney(total)}</td></tr>
        </table>
        <p style="color:#d8d0c3;line-height:1.6;margin:22px 0 0">Adresa: ${escapeHtml(salon.address)}. Plata se face in salon, iar pretul final poate varia dupa consultatie.</p>
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
      subject: `Programare confirmata la BlackSilva - ${booking.id}`,
    },
    {
      to: adminEmail,
      subject: `Programare noua BlackSilva - ${booking.id}`,
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

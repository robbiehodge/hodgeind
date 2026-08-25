// netlify/functions/notify-quote-submitted.js
// Alerts Robbie when a client submits their quote

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const { clientId, contact, items, quoteUrl } = body;
  const name      = contact?.name  || clientId || 'Unknown';
  const email     = contact?.email || '—';
  const phone     = contact?.phone || '—';
  const itemCount = (items || []).length;

  const itemRows = (items || []).map((it, i) => `
    <tr style="border-bottom:1px solid rgba(246,243,238,0.08);">
      <td style="padding:10px 12px;font-size:13px;color:#f6f3ee;">${i + 1}</td>
      <td style="padding:10px 12px;font-size:13px;color:#f6f3ee;">${it.name || '—'}</td>
      <td style="padding:10px 12px;font-size:13px;color:rgba(246,243,238,0.6);">${it.qty || 1}</td>
      <td style="padding:10px 12px;font-size:13px;color:rgba(246,243,238,0.6);">${it.type || '—'}</td>
      <td style="padding:10px 12px;font-size:13px;color:rgba(246,243,238,0.6);">${it.notes || '—'}</td>
      <td style="padding:10px 12px;font-size:13px;">${it.url ? `<a href="${it.url}" style="color:#c99a5f;font-size:12px;">View ↗</a>` : '—'}</td>
    </tr>`).join('');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Netlify.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Hodge Industries <admin@hodge-ind.com>',
        to: ['taldir@gmail.com'],
        reply_to: email !== '—' ? email : undefined,
        subject: `New Quote Submitted — ${name} (${itemCount} item${itemCount !== 1 ? 's' : ''})`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#221f1b;border-radius:10px;overflow:hidden;">
        <tr><td style="padding:28px 36px 20px;border-bottom:1px solid rgba(246,243,238,0.1);">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c99a5f;font-weight:600;">Hodge Industries · Internal</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#f6f3ee;">New Quote Submitted</h1>
        </td></tr>
        <tr><td style="padding:24px 36px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(169,121,63,0.1);border:1px solid rgba(169,121,63,0.3);border-radius:8px;">
            <tr>
              <td style="padding:14px 18px;border-right:1px solid rgba(169,121,63,0.2);">
                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#c99a5f;margin-bottom:4px;">Name</div>
                <div style="font-size:14px;color:#f6f3ee;font-weight:600;">${name}</div>
              </td>
              <td style="padding:14px 18px;border-right:1px solid rgba(169,121,63,0.2);">
                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#c99a5f;margin-bottom:4px;">Email</div>
                <div style="font-size:14px;"><a href="mailto:${email}" style="color:#c99a5f;text-decoration:none;">${email}</a></div>
              </td>
              <td style="padding:14px 18px;">
                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#c99a5f;margin-bottom:4px;">Phone</div>
                <div style="font-size:14px;color:#f6f3ee;">${phone}</div>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 36px 0;">
          <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#c99a5f;font-weight:600;">${itemCount} Item${itemCount !== 1 ? 's' : ''} Requested</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(246,243,238,0.1);border-radius:8px;overflow:hidden;">
            <tr style="background:rgba(246,243,238,0.05);">
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">#</th>
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">Item</th>
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">Qty</th>
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">Type</th>
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">Notes</th>
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">Link</th>
            </tr>
            ${itemRows}
          </table>
        </td></tr>
        <tr><td style="padding:24px 36px 32px;">
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#a9793f;border-radius:5px;">
              <a href="${quoteUrl}" style="display:inline-block;padding:12px 24px;font-size:13px;font-weight:700;color:#221f1b;text-decoration:none;">View in Admin →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 36px;border-top:1px solid rgba(246,243,238,0.08);">
          <p style="margin:0;font-size:11px;color:rgba(246,243,238,0.3);">Hodge Industries · admin@hodge-ind.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Resend error');
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Resend error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const config = { path: '/api/notify-quote-submitted' };

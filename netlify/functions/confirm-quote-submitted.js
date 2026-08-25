// netlify/functions/confirm-quote-submitted.js
// Sends the client a confirmation when their quote is submitted

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const { email, name, items, quoteUrl } = body;
  if (!email) return new Response(JSON.stringify({ ok: false, error: 'Missing email' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const displayName = name || 'there';
  const itemCount   = (items || []).length;
  const itemList    = (items || []).map((it, i) => `
    <tr style="border-bottom:1px solid rgba(246,243,238,0.06);">
      <td style="padding:10px 12px;font-size:13px;color:rgba(246,243,238,0.5);">${i + 1}</td>
      <td style="padding:10px 12px;font-size:13px;color:#f6f3ee;">${it.name || '—'}</td>
      <td style="padding:10px 12px;font-size:13px;color:rgba(246,243,238,0.6);">×${it.qty || 1}</td>
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
        to: [email],
        reply_to: 'admin@hodge-ind.com',
        subject: 'Your Quote Has Been Received — Hodge Industries',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#221f1b;border-radius:10px;overflow:hidden;">

        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid rgba(246,243,238,0.1);">
          <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c99a5f;font-weight:600;">Hodge Industries</p>
          <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:28px;font-weight:500;color:#f6f3ee;line-height:1.2;">Quote Received</h1>
        </td></tr>

        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:rgba(246,243,238,0.7);line-height:1.75;">
            Hi ${displayName} — we've received your furniture quote request. Robbie will review your items and follow up with pricing shortly.
          </p>

          ${itemCount > 0 ? `
          <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#c99a5f;font-weight:600;">Items You Submitted</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(246,243,238,0.1);border-radius:8px;overflow:hidden;margin-bottom:28px;">
            <tr style="background:rgba(246,243,238,0.05);">
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">#</th>
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">Item</th>
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">Qty</th>
            </tr>
            ${itemList}
          </table>` : ''}

          <div style="background:rgba(169,121,63,0.1);border:1px solid rgba(169,121,63,0.3);border-radius:8px;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0;font-size:13px;color:rgba(246,243,238,0.6);line-height:1.7;">
              Need to make a change? Reply to this email or contact Robbie directly at
              <a href="mailto:admin@hodge-ind.com" style="color:#c99a5f;text-decoration:none;">admin@hodge-ind.com</a>.
              Keep your quote link handy — you can view your submission anytime.
            </p>
          </div>

          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#a9793f;border-radius:5px;">
              <a href="${quoteUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#221f1b;text-decoration:none;letter-spacing:0.04em;">View My Submitted Quote →</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 40px;border-top:1px solid rgba(246,243,238,0.1);">
          <p style="margin:0;font-size:12px;color:rgba(246,243,238,0.3);">Hodge Industries · Charlotte, NC · <a href="https://hodge-ind.com" style="color:#c99a5f;text-decoration:none;">hodge-ind.com</a></p>
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

export const config = { path: '/api/confirm-quote-submitted' };

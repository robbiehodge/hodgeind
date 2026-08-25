// netlify/functions/notify-new-client.js
// Sends Robbie an internal alert when a new client generates their quote link

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const { email, quoteUrl, clientId } = body;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Hodge Industries <admin@hodge-ind.com>',
        to: ['taldir@gmail.com'],
        reply_to: email,
        subject: `New Quote Started — ${email}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#221f1b;border-radius:10px;overflow:hidden;">

        <tr><td style="padding:28px 36px 20px;border-bottom:1px solid rgba(246,243,238,0.1);">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c99a5f;font-weight:600;">Hodge Industries · Internal</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#f6f3ee;">New Client Started a Quote</h1>
        </td></tr>

        <tr><td style="padding:28px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(169,121,63,0.1);border:1px solid rgba(169,121,63,0.3);border-radius:8px;margin-bottom:24px;">
            <tr>
              <td style="padding:14px 18px;border-right:1px solid rgba(169,121,63,0.2);">
                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#c99a5f;margin-bottom:4px;">Email</div>
                <div style="font-size:14px;"><a href="mailto:${email}" style="color:#f6f3ee;text-decoration:none;">${email}</a></div>
              </td>
              <td style="padding:14px 18px;">
                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#c99a5f;margin-bottom:4px;">Quote ID</div>
                <div style="font-size:14px;color:#f6f3ee;font-family:monospace;">${clientId}</div>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 20px;font-size:14px;color:rgba(246,243,238,0.6);line-height:1.7;">
            They've received their quote link and have started browsing. No action needed yet — you'll get another notification when they submit.
          </p>

          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#a9793f;border-radius:5px;">
              <a href="${quoteUrl}" style="display:inline-block;padding:12px 24px;font-size:13px;font-weight:700;color:#221f1b;text-decoration:none;">
                View Their Quote Link →
              </a>
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

export const config = { path: '/api/notify-new-client' };

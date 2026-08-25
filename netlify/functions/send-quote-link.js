// netlify/functions/send-quote-link.js
// Sends the client their personal quote link via Resend

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { email, quoteUrl } = body;

  if (!email || !quoteUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing email or quoteUrl' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Hodge Industries <admin@hodge-ind.com>',
        to: [email],
        subject: 'Your Hodge Industries Furniture Quote Link',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#221f1b;border-radius:10px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid rgba(246,243,238,0.1);">
          <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c99a5f;font-weight:600;">Hodge Industries</p>
          <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:28px;font-weight:500;color:#f6f3ee;line-height:1.2;">Your Furniture Quote Link</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:rgba(246,243,238,0.7);line-height:1.7;">
            Here's your personal quote link. Bookmark it, save this email, or share it with anyone helping you pick items — it's yours to use anytime.
          </p>

          <!-- Link box -->
          <div style="background:rgba(169,121,63,0.12);border:1px solid rgba(169,121,63,0.4);border-radius:8px;padding:18px 20px;margin-bottom:28px;word-break:break-all;">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#c99a5f;font-weight:600;">Your Quote Link</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:16px;color:#f6f3ee;">${quoteUrl}</p>
          </div>

          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#a9793f;border-radius:5px;">
              <a href="${quoteUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#221f1b;text-decoration:none;letter-spacing:0.04em;">
                Open My Quote →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:rgba(246,243,238,0.4);line-height:1.7;">
            Add items at your own pace — your list saves automatically. Hit <strong style="color:rgba(246,243,238,0.7);">Submit for Quote</strong> when you're ready and Robbie will follow up with pricing.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(246,243,238,0.1);">
          <p style="margin:0;font-size:12px;color:rgba(246,243,238,0.3);">
            Hodge Industries · Charlotte, NC · <a href="https://hodge-ind.com" style="color:#c99a5f;text-decoration:none;">hodge-ind.com</a>
          </p>
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

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Resend error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = { path: '/api/send-quote-link' };

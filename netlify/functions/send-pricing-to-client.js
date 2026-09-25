// netlify/functions/send-pricing-to-client.js
// Emails the client their itemized pricing with an "Approve Quote" button

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const {
    email, name, items, itemsSubtotal, shippingAmount,
    shippingIncluded, total, deposit, quoteUrl
  } = body;

  if (!email) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing email' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const fmt = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const itemRows = (items || []).map((it, i) => `
    <tr style="border-bottom:1px solid rgba(246,243,238,0.08);">
      <td style="padding:12px;font-size:13px;color:rgba(246,243,238,0.5);">${i + 1}</td>
      <td style="padding:12px;font-size:14px;color:#f6f3ee;">${it.name || '—'}</td>
      <td style="padding:12px;font-size:13px;color:rgba(246,243,238,0.6);">×${it.qty || 1}</td>
      <td style="padding:12px;font-size:14px;color:#c99a5f;text-align:right;">${it.priceEach ? fmt(parseFloat(it.priceEach) * (it.qty||1)) : '—'}</td>
    </tr>`).join('');

  // Build the approve link — includes a token-free simple GET to the approve endpoint
  const approveUrl = quoteUrl + '&action=approve';

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
        subject: `Your Furniture Quote Pricing — ${fmt(total)}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#221f1b;border-radius:10px;overflow:hidden;">

        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid rgba(246,243,238,0.1);">
          <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c99a5f;font-weight:600;">Hodge Industries</p>
          <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:28px;font-weight:500;color:#f6f3ee;">Your Quote is Ready</h1>
        </td></tr>

        <tr><td style="padding:28px 40px;">
          <p style="margin:0 0 24px;font-size:15px;color:rgba(246,243,238,0.7);line-height:1.7;">
            Hi ${name || 'there'} — here's the pricing for your furniture quote. Take a look and approve when you're ready.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(246,243,238,0.1);border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:rgba(246,243,238,0.05);">
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">#</th>
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">Item</th>
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:left;">Qty</th>
              <th style="padding:10px 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#c99a5f;text-align:right;">Price</th>
            </tr>
            ${itemRows}
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(169,121,63,0.1);border:1px solid rgba(169,121,63,0.3);border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:14px 20px;font-size:13px;color:rgba(246,243,238,0.6);">Items Subtotal</td>
                <td style="padding:14px 20px;font-size:14px;color:#f6f3ee;text-align:right;">${fmt(itemsSubtotal)}</td></tr>
            ${shippingAmount > 0 ? `
            <tr><td style="padding:0 20px 14px;font-size:13px;color:rgba(246,243,238,0.6);">Shipping${shippingIncluded ? '' : ' (not included below — billed separately)'}</td>
                <td style="padding:0 20px 14px;font-size:14px;color:#f6f3ee;text-align:right;">${fmt(shippingAmount)}</td></tr>` : ''}
            <tr style="border-top:1px solid rgba(169,121,63,0.25);">
              <td style="padding:14px 20px;font-size:15px;color:#f6f3ee;font-weight:700;">${shippingIncluded ? 'Total — Out the Door' : 'Total'}</td>
              <td style="padding:14px 20px;font-family:Georgia,serif;font-size:22px;color:#c99a5f;font-weight:600;text-align:right;">${fmt(total)}</td>
            </tr>
            <tr><td style="padding:0 20px 14px;font-size:12px;color:rgba(246,243,238,0.4);">50% Deposit to Proceed</td>
                <td style="padding:0 20px 14px;font-size:13px;color:rgba(246,243,238,0.6);text-align:right;">${fmt(deposit)}</td></tr>
          </table>

          <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr><td style="background:#a9793f;border-radius:5px;">
              <a href="${approveUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#221f1b;text-decoration:none;letter-spacing:0.02em;">
                ✓ Approve This Quote
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:rgba(246,243,238,0.4);line-height:1.7;">
            Once you approve, we'll send an invoice for the deposit to get your order started. Questions or changes? Reply to this email.
          </p>
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

export const config = { path: '/api/send-pricing-to-client' };

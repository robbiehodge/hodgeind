// netlify/functions/approve-quote.js
// Client clicks "Approve" in their pricing email -> creates and publishes a Square invoice for the deposit

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const { clientId, email, name, phone, depositAmount, description } = body;

  if (!email || !depositAmount) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing email or depositAmount' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const SQUARE_TOKEN    = Netlify.env.get('SQUARE_ACCESS_TOKEN');
  const SQUARE_LOCATION = Netlify.env.get('SQUARE_LOCATION_ID');
  const SQUARE_BASE     = Netlify.env.get('SQUARE_ENV') === 'sandbox'
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

  const headers = {
    'Square-Version': '2024-10-17',
    'Authorization': `Bearer ${SQUARE_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Find or create the customer
    let customerId;
    const searchRes = await fetch(`${SQUARE_BASE}/v2/customers/search`, {
      method: 'POST', headers,
      body: JSON.stringify({ query: { filter: { email_address: { exact: email } } } }),
    });
    const searchData = await searchRes.json();
    if (searchData.customers && searchData.customers.length) {
      customerId = searchData.customers[0].id;
    } else {
      const createCustRes = await fetch(`${SQUARE_BASE}/v2/customers`, {
        method: 'POST', headers,
        body: JSON.stringify({
          given_name: name || email.split('@')[0],
          email_address: email,
          phone_number: phone || undefined,
        }),
      });
      const createCustData = await createCustRes.json();
      if (!createCustRes.ok) throw new Error(JSON.stringify(createCustData.errors));
      customerId = createCustData.customer.id;
    }

    // 2. Create an order for the deposit amount
    const amountCents = Math.round(parseFloat(depositAmount) * 100);
    const orderRes = await fetch(`${SQUARE_BASE}/v2/orders`, {
      method: 'POST', headers,
      body: JSON.stringify({
        idempotency_key: `deposit-${clientId}-${Date.now()}`,
        order: {
          location_id: SQUARE_LOCATION,
          line_items: [{
            name: description || 'Furniture Order — 50% Deposit',
            quantity: '1',
            base_price_money: { amount: amountCents, currency: 'USD' },
          }],
        },
      }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(JSON.stringify(orderData.errors));
    const orderId = orderData.order.id;

    // 3. Create the invoice (draft)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // due in 7 days
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const invoiceRes = await fetch(`${SQUARE_BASE}/v2/invoices`, {
      method: 'POST', headers,
      body: JSON.stringify({
        idempotency_key: `invoice-${clientId}-${Date.now()}`,
        invoice: {
          order_id: orderId,
          location_id: SQUARE_LOCATION,
          primary_recipient: { customer_id: customerId },
          payment_requests: [{
            request_type: 'BALANCE',
            due_date: dueDateStr,
          }],
          delivery_method: 'EMAIL',
          title: 'Furniture Order Deposit',
          description: description || 'Hodge Industries — 50% deposit to begin your custom furniture order.',
          accepted_payment_methods: { card: true, bank_account: true },
        },
      }),
    });
    const invoiceData = await invoiceRes.json();
    if (!invoiceRes.ok) throw new Error(JSON.stringify(invoiceData.errors));
    const invoice = invoiceData.invoice;

    // 4. Publish the invoice — this sends it to the client's email
    const publishRes = await fetch(`${SQUARE_BASE}/v2/invoices/${invoice.id}/publish`, {
      method: 'POST', headers,
      body: JSON.stringify({
        version: invoice.version,
        idempotency_key: `publish-${clientId}-${Date.now()}`,
      }),
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok) throw new Error(JSON.stringify(publishData.errors));

    return new Response(JSON.stringify({
      ok: true,
      invoiceId: invoice.id,
      publicUrl: publishData.invoice.public_url,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Square invoice error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = { path: '/api/approve-quote' };

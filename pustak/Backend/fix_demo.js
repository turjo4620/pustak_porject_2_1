/**
 * fix_demo.js
 * Completes the demo account:
 *  1. Moves 4 orders to Delivered (for returns)
 *  2. Submits 4 return requests
 *  3. Moves 8 more orders to Delivered (for reviews)  
 *  4. Submits 8 reviews (using correct book_id from order items)
 *  5. Adds 1 more order so we have 12 total
 */

const pool = require('./src/config/db');
const jwt  = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-auth-secret';
const BASE = 'http://localhost:5000/api';
const DEMO_EMAIL = 'demo@pustak.com';
let userId, token;

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  if (!res.ok) {
    console.error(`  ✗ ${method} ${path} → ${res.status}:`, json.message || json._raw?.slice(0, 120));
    return null;
  }
  return json;
}

// ── Directly update order status in DB ──────────────────────────────────────
async function setOrderStatus(orderId, status) {
  await pool.query('UPDATE orders SET status = $1 WHERE order_id = $2', [status, orderId]);
}

// ── Set delivered_at so return window check passes ───────────────────────────
async function ensureDelivery(orderId) {
  // Check if delivery row exists
  const ex = await pool.query('SELECT delivery_id FROM deliveries WHERE order_id = $1', [orderId]);
  if (ex.rows.length) {
    await pool.query(
      "UPDATE deliveries SET delivered_at = NOW() - INTERVAL '1 day', status = 'Delivered' WHERE order_id = $1",
      [orderId]
    );
  } else {
    // Get a courier
    const courier = await pool.query('SELECT courier_id FROM couriers LIMIT 1');
    const courierId = courier.rows[0]?.courier_id || null;
    await pool.query(
      `INSERT INTO deliveries (order_id, courier_id, status, estimated_delivery, delivered_at)
       VALUES ($1, $2, 'Delivered', NOW(), NOW() - INTERVAL '1 day')`,
      [orderId, courierId]
    );
  }
}

// ── Get book_id from an order's first item (via book_copy) ───────────────────
async function getBookIdFromOrder(orderId) {
  const r = await pool.query(
    `SELECT b.id AS book_id, oi.order_item_id
     FROM order_item oi
     JOIN book_copy bc ON bc.copy_id = oi.copy_id
     JOIN books b ON b.id = bc.book_id
     WHERE oi.order_id = $1
     LIMIT 1`,
    [orderId]
  );
  return r.rows[0] || null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n══════════════════════════════════════════════════');
  console.log('   Pustak Demo Account — Fix & Complete');
  console.log('══════════════════════════════════════════════════');

  // Get demo user
  const userRes = await pool.query("SELECT user_id FROM users WHERE email = $1", [DEMO_EMAIL]);
  if (!userRes.rows.length) { console.error('Demo user not found!'); process.exit(1); }
  userId = userRes.rows[0].user_id;
  token  = jwt.sign({ sub: userId, role: 'customer' }, JWT_SECRET, { expiresIn: '1h' });
  console.log(`\n  ✓ Demo user id=${userId}, token generated`);

  // Get all demo orders
  const ordersRes = await pool.query(
    'SELECT order_id, order_number, status FROM orders WHERE user_id = $1 ORDER BY order_id',
    [userId]
  );
  const orders = ordersRes.rows;
  console.log(`  ✓ Found ${orders.length} orders`);

  // ── Place one more order if we have less than 12 ──
  if (orders.length < 12) {
    console.log('\n── Placing additional order ──');
    const books = await (await fetch(`${BASE}/books?limit=5&offset=20`)).json();
    const pick = books.data?.[0];
    if (pick) {
      const addrRes = await pool.query(
        'SELECT address_id FROM addresses WHERE user_id = $1 LIMIT 1', [userId]
      );
      const addrId = addrRes.rows[0]?.address_id;
      const r = await api('POST', '/orders/buy-now', {
        bookId: pick.id, quantity: 2, addressId: addrId, deliveryCharge: 60,
      });
      if (r) {
        const newOid = r.order_id || r.id;
        orders.push({ order_id: newOid, order_number: r.order_number, status: 'Pending' });
        console.log(`  ✓ Extra order #${newOid} — "${pick.book_name}" x2`);
      }
    }
  }

  // ── Update statuses for a realistic mix ──────────────────────────────────
  console.log('\n── Updating order statuses ──');
  const statusMap = [
    // order index → desired status
    [0,  'Delivered'],   // will be returned
    [1,  'Delivered'],   // will be returned
    [2,  'Delivered'],   // will be returned
    [3,  'Delivered'],   // will be returned
    [4,  'Delivered'],   // will be reviewed
    [5,  'Delivered'],   // will be reviewed
    [6,  'Delivered'],   // will be reviewed
    [7,  'Delivered'],   // will be reviewed
    [8,  'Delivered'],   // will be reviewed
    [9,  'Confirmed'],
    [10, 'Paid'],
    [11, 'Pending'],
  ];

  for (const [idx, status] of statusMap) {
    if (idx >= orders.length) continue;
    const o = orders[idx];
    await setOrderStatus(o.order_id, status);
    if (status === 'Delivered') await ensureDelivery(o.order_id);
    console.log(`  ✓ Order #${o.order_id} (${o.order_number}) → ${status}`);
  }

  // ── Submit return requests (first 4 delivered orders) ────────────────────
  console.log('\n── Submitting return requests ──');
  const returnReasons = [
    'ভুল বই পাঠানো হয়েছে — অন্য সংস্করণ এসেছে',
    'বইয়ের পাতা ছেঁড়া ও কোণা মুড়ানো ছিল',
    'বইটি প্রত্যাশার চেয়ে আলাদা মনে হয়েছে',
    'ডুপ্লিকেট অর্ডার হয়ে গেছে',
  ];

  for (let i = 0; i < 4; i++) {
    const o = orders[i];
    const items = await pool.query(
      'SELECT order_item_id FROM order_item WHERE order_id = $1 LIMIT 1', [o.order_id]
    );
    if (!items.rows.length) { console.log(`  ✗ No items for order #${o.order_id}`); continue; }
    const itemId = items.rows[0].order_item_id;

    // Check no duplicate return
    const dup = await pool.query('SELECT return_id FROM "return" WHERE order_item_id = $1', [itemId]);
    if (dup.rows.length) { console.log(`  ℹ Return already exists for order #${o.order_id}`); continue; }

    const r = await api('POST', '/returns', { orderItemId: itemId, reason: returnReasons[i] });
    if (r) console.log(`  ✓ Return requested for order #${o.order_id} — "${returnReasons[i]}"`);
  }

  // ── Submit reviews (orders 4–8, using the correct book_ids) ──────────────
  console.log('\n── Submitting reviews ──');
  const reviewData = [
    { rating: 5, comment: 'অসাধারণ বই! বাংলা সাহিত্যের একটি মাস্টারপিস। সবাইকে পড়ার অনুরোধ জানাই।' },
    { rating: 5, comment: 'লেখার ভাষা খুবই সুন্দর। গল্পের প্রতিটি অধ্যায় পাঠককে মুগ্ধ করে।' },
    { rating: 4, comment: 'দারুণ বই, তবে পৃষ্ঠার মান আরও ভালো হতে পারত। পুস্তকের ডেলিভারি দ্রুত ছিল।' },
    { rating: 5, comment: 'এই বইটি পড়ে অনেক কিছু শিখলাম। লেখককে অসংখ্য ধন্যবাদ।' },
    { rating: 4, comment: 'চমৎকার। মূল বইয়ের আবেদন ঠিকঠাক ধরা হয়েছে। বারবার পড়ার মতো বই।' },
    { rating: 3, comment: 'একটু বেশি দার্শনিক, তবে মনে দাগ কাটে। নতুন পাঠকদের কঠিন লাগতে পারে।' },
    { rating: 5, comment: 'পুস্তক থেকে ডেলিভারি খুব দ্রুত হয়েছে। বইটিও একদম নতুন অবস্থায় পেয়েছি।' },
    { rating: 4, comment: 'শিশুদের জন্য দুর্দান্ত। সহজ ভাষায় জ্ঞান ও বিজ্ঞান উপস্থাপন করা হয়েছে।' },
  ];

  const reviewedBookIds = new Set();
  let reviewCount = 0;

  for (let i = 4; i < orders.length && reviewCount < 8; i++) {
    const o = orders[i];
    const item = await getBookIdFromOrder(o.order_id);
    if (!item) { console.log(`  ✗ No book found for order #${o.order_id}`); continue; }

    const { book_id, order_item_id } = item;
    if (reviewedBookIds.has(book_id)) {
      console.log(`  ℹ Skipping duplicate book_id=${book_id}`);
      continue;
    }

    const { rating, comment } = reviewData[reviewCount];
    // Direct DB insert to avoid any purchase-check middleware
    const existing = await pool.query(
      'SELECT review_id FROM reviews WHERE user_id = $1 AND book_id = $2', [userId, book_id]
    );
    if (existing.rows.length) {
      console.log(`  ℹ Review already exists for book_id=${book_id}`);
      reviewedBookIds.add(book_id);
      reviewCount++;
      continue;
    }

    await pool.query(
      'INSERT INTO reviews (user_id, book_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [userId, book_id, rating, comment]
    );
    // Update book aggregate
    const agg = await pool.query(
      `SELECT ROUND(AVG(rating),1) AS avg_r, COUNT(*)::int AS cnt FROM reviews WHERE book_id = $1 AND COALESCE(is_hidden,FALSE) = FALSE`,
      [book_id]
    );
    await pool.query(
      'UPDATE books SET rating = $1, num_reviews = $2 WHERE id = $3',
      [agg.rows[0].avg_r, agg.rows[0].cnt, book_id]
    );

    const bookName = await pool.query('SELECT book_name FROM books WHERE id = $1', [book_id]);
    console.log(`  ✓ Review (${rating}★) — "${bookName.rows[0]?.book_name}"`);
    reviewedBookIds.add(book_id);
    reviewCount++;
  }

  // If still fewer than 8 reviews, fill from bestseller books not yet reviewed
  if (reviewCount < 8) {
    console.log('  ℹ Filling remaining reviews from book catalog...');
    const extras = await pool.query(
      `SELECT id, book_name FROM books
       WHERE id NOT IN (SELECT book_id FROM reviews WHERE user_id = $1)
       ORDER BY num_reviews DESC NULLS LAST
       LIMIT $2`,
      [userId, 8 - reviewCount]
    );
    for (const b of extras.rows) {
      const { rating, comment } = reviewData[reviewCount] || { rating: 4, comment: 'চমৎকার বই।' };
      await pool.query(
        'INSERT INTO reviews (user_id, book_id, rating, comment) VALUES ($1, $2, $3, $4)',
        [userId, b.id, rating, comment]
      );
      const agg = await pool.query(
        `SELECT ROUND(AVG(rating),1) AS avg_r, COUNT(*)::int AS cnt FROM reviews WHERE book_id = $1`,
        [b.id]
      );
      await pool.query(
        'UPDATE books SET rating = $1, num_reviews = $2 WHERE id = $3',
        [agg.rows[0].avg_r, agg.rows[0].cnt, b.id]
      );
      console.log(`  ✓ Review (${rating}★) — "${b.book_name}"`);
      reviewCount++;
    }
  }

  // Final summary
  const finalOrders = await pool.query(
    'SELECT status, COUNT(*) FROM orders WHERE user_id = $1 GROUP BY status ORDER BY status',
    [userId]
  );
  const finalReturns = await pool.query(
    `SELECT COUNT(*) FROM "return" r
     JOIN order_item oi ON oi.order_item_id = r.order_item_id
     JOIN orders o ON o.order_id = oi.order_id
     WHERE o.user_id = $1`, [userId]
  );
  const finalReviews = await pool.query(
    'SELECT COUNT(*) FROM reviews WHERE user_id = $1', [userId]
  );

  console.log('\n══════════════════════════════════════════════════');
  console.log('   ✅  Demo account fully seeded!');
  console.log('══════════════════════════════════════════════════');
  console.log('\n  📧  Email    : demo@pustak.com');
  console.log('  🔑  Password : Demo@1234');
  console.log('  👤  Login as : Customer');
  console.log('\n  📦  Orders:');
  for (const row of finalOrders.rows) {
    console.log(`       ${row.status.padEnd(12)} × ${row.count}`);
  }
  console.log(`  ↩️   Return requests : ${finalReturns.rows[0].count}`);
  console.log(`  ⭐  Reviews          : ${finalReviews.rows[0].count}`);
  console.log('══════════════════════════════════════════════════\n');

  await pool.end();
})().catch(async (e) => {
  console.error('Fatal:', e.message || e);
  await pool.end();
  process.exit(1);
});

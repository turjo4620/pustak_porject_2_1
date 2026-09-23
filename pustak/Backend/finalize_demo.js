/**
 * finalize_demo.js
 * Directly inserts returns and reviews using the exact DB schema.
 * return table:  return_id, order_item_id, reason, return_date, status, approved_at
 * reviews table: review_id, user_id, book_id, rating, comment
 * deliveries:    delivery_id, order_id, tracking_no, dispatch_date, est_date, delivered_at, status, courier_id, delivery_charge
 */
const pool = require('./src/config/db');

const DEMO_EMAIL = 'demo@pustak.com';

async function main() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('   Pustak Demo — Finalize Returns & Reviews');
  console.log('══════════════════════════════════════════════════');

  const userRes = await pool.query("SELECT user_id FROM users WHERE email = $1", [DEMO_EMAIL]);
  const userId = userRes.rows[0]?.user_id;
  if (!userId) { console.error('Demo user not found'); process.exit(1); }
  console.log(`\n  ✓ userId = ${userId}`);

  // All demo orders
  const ordersRes = await pool.query(
    'SELECT order_id, order_number, status FROM orders WHERE user_id = $1 ORDER BY order_id',
    [userId]
  );
  const orders = ordersRes.rows;
  console.log(`  ✓ ${orders.length} orders found`);

  // ── Ensure deliveries exist for Delivered orders ──────────────────────────
  console.log('\n── Ensuring delivery records ──');
  const courierRes = await pool.query('SELECT courier_id FROM courier LIMIT 1');
  const courierId = courierRes.rows[0]?.courier_id || null;

  for (const o of orders) {
    if (o.status !== 'Delivered') continue;
    const ex = await pool.query('SELECT delivery_id FROM deliveries WHERE order_id = $1', [o.order_id]);
    if (ex.rows.length) {
      await pool.query(
        "UPDATE deliveries SET delivered_at = NOW() - INTERVAL '1 day', status = 'Delivered' WHERE order_id = $1",
        [o.order_id]
      );
      console.log(`  ✓ Updated delivery for order #${o.order_id}`);
    } else {
      await pool.query(
        `INSERT INTO deliveries (order_id, courier_id, status, est_date, delivered_at, delivery_charge)
         VALUES ($1, $2, 'Delivered', NOW(), NOW() - INTERVAL '1 day', 60)`,
        [o.order_id, courierId]
      );
      console.log(`  ✓ Created delivery for order #${o.order_id}`);
    }
  }

  // ── Get order items ──────────────────────────────────────────────────────
  const allItemsRes = await pool.query(
    `SELECT oi.order_item_id, oi.order_id, oi.copy_id,
            bc.book_id, b.book_name
     FROM order_item oi
     JOIN orders o ON o.order_id = oi.order_id
     JOIN book_copy bc ON bc.copy_id = oi.copy_id
     JOIN books b ON b.id = bc.book_id
     WHERE o.user_id = $1
     ORDER BY oi.order_item_id`,
    [userId]
  );
  const allItems = allItemsRes.rows;

  // Group by order
  const itemsByOrder = {};
  for (const item of allItems) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item);
  }

  // ── Insert return requests (orders 0-3 = Delivered) ────────────────────
  console.log('\n── Inserting return requests ──');
  const returnReasons = [
    'ভুল বই পাঠানো হয়েছে — অন্য সংস্করণ এসেছে',
    'বইয়ের পাতা ছেঁড়া ও কোণা মুড়ানো ছিল',
    'বইটি প্রত্যাশার চেয়ে ভিন্ন মনে হয়েছে',
    'ডুপ্লিকেট অর্ডার হয়ে গেছে',
  ];

  let returnCount = 0;
  for (let i = 0; i < 4 && i < orders.length; i++) {
    const o = orders[i];
    const items = itemsByOrder[o.order_id] || [];
    if (!items.length) { console.log(`  ✗ No items for order #${o.order_id}`); continue; }
    const item = items[0];

    // Skip if return already exists
    const dup = await pool.query(
      'SELECT return_id FROM "return" WHERE order_item_id = $1', [item.order_item_id]
    );
    if (dup.rows.length) { console.log(`  ℹ Return already exists for order #${o.order_id}`); returnCount++; continue; }

    await pool.query(
      `INSERT INTO "return" (order_item_id, reason, status)
       VALUES ($1, $2, 'initiated')`,
      [item.order_item_id, returnReasons[i]]
    );
    console.log(`  ✓ Return for order #${o.order_id} — "${item.book_name}" (${returnReasons[i].slice(0, 40)}...)`);
    returnCount++;
  }

  // ── Insert reviews (orders 4-11) ─────────────────────────────────────────
  console.log('\n── Inserting reviews ──');
  const reviewData = [
    { rating: 5, comment: 'অসাধারণ বই! বাংলা সাহিত্যের একটি মাস্টারপিস। সবাইকে পড়ার অনুরোধ জানাই।' },
    { rating: 5, comment: 'লেখার ভাষা খুবই সুন্দর। গল্পের প্রতিটি অধ্যায় পাঠককে মুগ্ধ করে রাখে।' },
    { rating: 4, comment: 'দারুণ বই, তবে পৃষ্ঠার মান আরও ভালো হতে পারত। পুস্তকের ডেলিভারি দ্রুত ছিল।' },
    { rating: 5, comment: 'এই বইটি পড়ে অনেক কিছু শিখলাম। লেখককে অসংখ্য ধন্যবাদ।' },
    { rating: 4, comment: 'চমৎকার অনুবাদ। মূল বইয়ের আবেদন ঠিকঠাক ধরা হয়েছে।' },
    { rating: 3, comment: 'একটু বেশি দার্শনিক তবে মনে দাগ কাটে। নতুন পাঠকদের কঠিন লাগতে পারে।' },
    { rating: 5, comment: 'পুস্তক থেকে ডেলিভারি খুব দ্রুত হয়েছে। বইটিও একদম নতুন অবস্থায় পেলাম।' },
    { rating: 4, comment: 'শিশুদের জন্য দুর্দান্ত। সহজ ভাষায় জ্ঞান ও বিজ্ঞান উপস্থাপন করা হয়েছে।' },
  ];

  const reviewedBooks = new Set();
  let reviewCount = 0;

  for (let i = 4; i < orders.length && reviewCount < 8; i++) {
    const o = orders[i];
    const items = itemsByOrder[o.order_id] || [];
    if (!items.length) continue;

    const bookId = items[0].book_id;
    if (reviewedBooks.has(bookId)) continue;

    // Skip if review already exists
    const dup = await pool.query(
      'SELECT review_id FROM reviews WHERE user_id = $1 AND book_id = $2', [userId, bookId]
    );
    if (dup.rows.length) {
      console.log(`  ℹ Review already exists for "${items[0].book_name}"`);
      reviewedBooks.add(bookId);
      reviewCount++;
      continue;
    }

    const { rating, comment } = reviewData[reviewCount];
    await pool.query(
      'INSERT INTO reviews (user_id, book_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [userId, bookId, rating, comment]
    );

    // Update book aggregate rating
    const agg = await pool.query(
      'SELECT ROUND(AVG(rating),1) AS avg_r, COUNT(*)::int AS cnt FROM reviews WHERE book_id = $1',
      [bookId]
    );
    await pool.query(
      'UPDATE books SET rating = $1, num_reviews = $2 WHERE id = $3',
      [agg.rows[0].avg_r, agg.rows[0].cnt, bookId]
    );

    console.log(`  ✓ Review (${rating}★) — "${items[0].book_name}"`);
    reviewedBooks.add(bookId);
    reviewCount++;
  }

  // Pad to 8 reviews from catalog if needed
  if (reviewCount < 8) {
    const extras = await pool.query(
      `SELECT id, book_name FROM books
       WHERE id NOT IN (SELECT book_id FROM reviews WHERE user_id = $1)
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
        'SELECT ROUND(AVG(rating),1) AS avg_r, COUNT(*)::int AS cnt FROM reviews WHERE book_id = $1',
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

  // ── Final summary ─────────────────────────────────────────────────────────
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
  const wishCount = await pool.query(
    `SELECT COUNT(*) FROM wishlist_item wi JOIN wishlist w ON w.wishlist_id = wi.wishlist_id WHERE w.user_id = $1`,
    [userId]
  );

  console.log('\n══════════════════════════════════════════════════');
  console.log('   ✅  Demo account fully seeded!');
  console.log('══════════════════════════════════════════════════');
  console.log('\n  📧  Email    : demo@pustak.com');
  console.log('  🔑  Password : Demo@1234');
  console.log('  👤  Login as : Customer (not Admin)');
  console.log('\n  📦  Orders by status:');
  for (const row of finalOrders.rows) {
    console.log(`       ${row.status.padEnd(12)} × ${row.count}`);
  }
  console.log(`  ↩️   Return requests : ${finalReturns.rows[0].count}`);
  console.log(`  ⭐  Reviews          : ${finalReviews.rows[0].count}`);
  console.log(`  ❤️   Wishlist items  : ${wishCount.rows[0].count}`);
  console.log('══════════════════════════════════════════════════\n');

  await pool.end();
}

main().catch(async e => { console.error('Fatal:', e.message || e); await pool.end(); process.exit(1); });

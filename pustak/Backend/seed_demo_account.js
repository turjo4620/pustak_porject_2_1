/**
 * seed_demo_account.js
 * Creates a fully-populated demo customer account with:
 *   - Registered user
 *   - 1 delivery address
 *   - Wishlist items
 *   - 12 orders (buy-now, varied statuses)
 *   - 4 return requests
 *   - 8 reviews
 */

const BASE = 'http://localhost:5000/api';
let token = '';

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);

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

// ── 1. Register ──────────────────────────────────────────────────────────────
async function register() {
  console.log('\n── 1. Registering demo account ──');
  const r = await api('POST', '/auth/signup', {
    name:     'Demo Pathok',
    email:    'demo@pustak.com',
    password: 'Demo@1234',
  });
  if (!r) { console.error('Registration failed'); process.exit(1); }
  token = r.token;
  console.log(`  ✓ Created user: ${r.user.name} <${r.user.email}>`);
  return r.user;
}

// ── 2. Add address ───────────────────────────────────────────────────────────
async function addAddress() {
  console.log('\n── 2. Adding delivery address ──');
  const r = await api('POST', '/addresses', {
    label:        'বাড়ি',
    full_name:    'Demo Pathok',
    phone:        '01711223344',
    address_line1:'বাড়ি ৫, রোড ৩, ব্লক খ',
    address_line2:'মিরপুর-১২',
    city:         'ঢাকা',
    district:     'ঢাকা',
    postal_code:  '1216',
    is_default:   true,
  });
  if (!r) return null;
  const addrId = r.data?.address_id || r.address_id || r.id;
  console.log(`  ✓ Address created (id=${addrId})`);
  return addrId;
}

// ── 3. Fetch some books ──────────────────────────────────────────────────────
async function getBooks() {
  console.log('\n── 3. Fetching books ──');
  const r = await api('GET', '/books?limit=40');
  const books = r?.data || [];
  console.log(`  ✓ Fetched ${books.length} books`);
  return books;
}

// ── 4. Add wishlist items ────────────────────────────────────────────────────
async function addWishlist(books) {
  console.log('\n── 4. Adding wishlist items ──');
  const picks = books.slice(0, 6);
  for (const b of picks) {
    const r = await api('POST', '/wishlist/items', { bookId: b.id });
    if (r) console.log(`  ✓ Wishlisted: ${b.book_name}`);
  }
}

// ── 5. Place orders ──────────────────────────────────────────────────────────
async function placeOrders(books, addressId) {
  console.log('\n── 5. Placing 12 orders ──');
  const orderIds = [];

  // Pick 12 distinct books (or repeat if fewer available)
  const picks = [];
  for (let i = 0; i < 12; i++) picks.push(books[i % books.length]);

  for (let i = 0; i < picks.length; i++) {
    const b = picks[i];
    const qty = (i % 3) + 1; // 1, 2, or 3 copies
    const r = await api('POST', '/orders/buy-now', {
      bookId:        b.id,
      quantity:      qty,
      addressId,
      deliveryCharge: 60,
    });
    if (r) {
      const oid = r.order_id || r.id || r.orderId || r.data?.order_id;
      orderIds.push({ orderId: oid, book: b });
      console.log(`  ✓ Order #${oid} — "${b.book_name}" x${qty}`);
    }
  }
  return orderIds;
}

// ── 6. Fetch order items (needed for returns) ────────────────────────────────
async function getOrderItems(orderId) {
  const r = await api('GET', `/orders/${orderId}`);
  return r?.items || r?.data?.items || [];
}

// ── 7. Submit return requests (on first 4 orders) ────────────────────────────
async function submitReturns(orders) {
  console.log('\n── 6. Submitting return requests ──');
  const reasons = [
    'ভুল বই পাঠানো হয়েছে',
    'বইয়ের পাতা ছেঁড়া ছিল',
    'বইটি প্রত্যাশার চেয়ে আলাদা',
    'ডুপ্লিকেট অর্ডার হয়ে গেছে',
  ];

  for (let i = 0; i < Math.min(4, orders.length); i++) {
    const { orderId, book } = orders[i];
    const items = await getOrderItems(orderId);
    if (!items.length) { console.log(`  ✗ No items for order #${orderId}`); continue; }
    const itemId = items[0].order_item_id || items[0].id;
    const r = await api('POST', '/returns', {
      orderItemId: itemId,
      reason:      reasons[i],
    });
    if (r) console.log(`  ✓ Return request for order #${orderId} — "${book.book_name}" (${reasons[i]})`);
  }
}

// ── 8. Submit reviews (on orders 5-12) ───────────────────────────────────────
async function submitReviews(orders, books) {
  console.log('\n── 7. Submitting reviews ──');
  const comments = [
    'অসাধারণ বই! বাংলা সাহিত্যের একটি মাস্টারপিস। সবাইকে পড়ার অনুরোধ জানাই।',
    'লেখার ভাষা খুবই সুন্দর। গল্পের প্রতিটি অধ্যায় মুগ্ধ করেছে।',
    'দারুণ বই, তবে পৃষ্ঠার মান আরও ভালো হতে পারত।',
    'এই বইটি পড়ে অনেক কিছু শিখলাম। লেখককে ধন্যবাদ।',
    'চমৎকার অনুবাদ। মূল বইয়ের আবেদন ঠিকঠাক ধরা হয়েছে।',
    'একটু বেশি দার্শনিক, তবে মনে দাগ কাটে।',
    'পুস্তক থেকে ডেলিভারি দ্রুত হয়েছে। বইটিও চমৎকার।',
    'বাচ্চাদের জন্য দুর্দান্ত। সহজ ভাষায় জ্ঞান বিজ্ঞান শেখানো হয়েছে।',
  ];
  const ratings = [5, 5, 4, 5, 4, 3, 5, 4];

  // Review books from orders[4..11], or fallback to books array
  const reviewTargets = orders.length >= 5
    ? orders.slice(4, 12)
    : orders.slice(0, 8);

  for (let i = 0; i < Math.min(8, reviewTargets.length); i++) {
    const bookId = reviewTargets[i].book.id;
    const r = await api('POST', '/reviews', {
      bookId:  bookId,
      rating:  ratings[i],
      comment: comments[i],
    });
    if (r) console.log(`  ✓ Review (${ratings[i]}★) for "${reviewTargets[i].book.book_name}"`);
  }
}

// ── 9. Add a few more books to cart (showing cart activity) ──────────────────
async function populateCart(books) {
  console.log('\n── 8. Adding items to cart ──');
  const picks = books.slice(15, 19);
  for (const b of picks) {
    const r = await api('POST', '/cart/items', { bookId: b.id, quantity: 1 });
    if (r) console.log(`  ✓ In cart: ${b.book_name}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('   Pustak Demo Account Seeder');
  console.log('═══════════════════════════════════════════════════');

  const user    = await register();
  const addrId  = await addAddress();
  const books   = await getBooks();

  if (!books.length) {
    console.error('No books found — make sure the backend DB has book data.');
    process.exit(1);
  }

  await addWishlist(books);
  const orders = await placeOrders(books, addrId);
  await submitReturns(orders);
  await submitReviews(orders, books);
  await populateCart(books);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   ✅  DONE — Demo account ready');
  console.log('═══════════════════════════════════════════════════');
  console.log('   Email    : demo@pustak.com');
  console.log('   Password : Demo@1234');
  console.log('   Login as : Customer');
  console.log('═══════════════════════════════════════════════════\n');
})();

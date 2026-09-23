const pool = require('./src/config/db');
(async () => {
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name`);
  console.log('TABLES:', tables.rows.map(r => r.table_name).join(', '));

  // Check reviews columns
  const rv = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='reviews' ORDER BY ordinal_position`);
  console.log('\nREVIEWS COLS:', rv.rows.map(r => r.column_name).join(', '));

  // Check cart_item columns
  const ci = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='cart_item' ORDER BY ordinal_position`);
  console.log('CART_ITEM COLS:', ci.rows.map(r => r.column_name).join(', '));

  // Check orders columns
  const ord = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='orders' ORDER BY ordinal_position`);
  console.log('ORDERS COLS:', ord.rows.map(r => r.column_name).join(', '));

  // Check addresses columns
  const addr = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='addresses' ORDER BY ordinal_position`);
  console.log('ADDRESSES COLS:', addr.rows.map(r => r.column_name).join(', '));

  // Check return table columns
  const ret = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='return' ORDER BY ordinal_position`);
  console.log('RETURN COLS:', ret.rows.map(r => r.column_name).join(', '));

  // Check refund table columns
  const ref = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='refund' ORDER BY ordinal_position`);
  console.log('REFUND COLS:', ref.rows.map(r => r.column_name).join(', '));

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });

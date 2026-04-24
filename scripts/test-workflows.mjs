/**
 * Fikir Design Dashboard — API Workflow Test Script
 * Run: node scripts/test-workflows.mjs
 * Requires the dev server running on http://localhost:3000
 */

const BASE = 'http://localhost:3000'
let SESSION_COOKIE = ''

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0, failed = 0
const results = []

function log(label, ok, detail = '') {
  const icon = ok ? '✅' : '❌'
  const msg = `${icon} ${label}${detail ? ` — ${detail}` : ''}`
  console.log(msg)
  results.push({ label, ok, detail })
  if (ok) passed++; else failed++
}

async function probe(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(SESSION_COOKIE ? { Cookie: SESSION_COOKIE } : {}) },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  let data
  try { data = await res.json() } catch { data = {} }
  return { status: res.status, data }
}

async function req(method, path, body, expectStatus = 200) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(SESSION_COOKIE ? { Cookie: SESSION_COOKIE } : {}) },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)

  // Capture session cookie from login
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) SESSION_COOKIE = setCookie.split(';')[0]

  let data
  try { data = await res.json() } catch { data = {} }

  const ok = res.status === expectStatus
  return { ok, status: res.status, data }
}

// ── Test Suites ───────────────────────────────────────────────────────────────

async function testAuth() {
  console.log('\n── AUTH ─────────────────────────────────────────────')

  const bad = await req('POST', '/api/auth/login', { username: 'wrong', password: 'wrong' }, 401)
  log('Login with bad credentials → 401', bad.ok)

  const good = await req('POST', '/api/auth/login', { username: 'admin', password: 'admin123' }, 200)
  log('Login with valid credentials → 200', good.ok, good.data?.user?.role)

  const me = await req('GET', '/api/auth/me', null, 200)
  log('GET /api/auth/me → 200', me.ok, me.data?.username)

  return good.ok
}

async function testCustomers() {
  console.log('\n── CUSTOMERS ────────────────────────────────────────')

  const list = await req('GET', '/api/customers?limit=5', null, 200)
  log('GET /api/customers → 200', list.ok, `total: ${list.data?.total}`)

  const create = await req('POST', '/api/customers', {
    firstName: 'Test', lastName: 'Customer',
    phone: '+251911000001', email: 'test@fikir.et',
    address: 'Bole', city: 'Addis Ababa', status: 'active',
  }, 201)
  log('POST /api/customers → 201', create.ok, `id: ${create.data?.id}`)
  const customerId = create.data?.id

  if (customerId) {
    const get = await req('GET', `/api/customers/${customerId}`, null, 200)
    log(`GET /api/customers/${customerId} → 200`, get.ok)

    const update = await req('PUT', `/api/customers/${customerId}`, {
      firstName: 'Test', lastName: 'Updated', status: 'active',
      bodyMeasurements: { height: 170, chest: 90 },
    }, 200)
    log(`PUT /api/customers/${customerId} → 200`, update.ok)

    const del = await req('DELETE', `/api/customers/${customerId}`, null, 200)
    log(`DELETE /api/customers/${customerId} → 200`, del.ok)
  }

  return customerId
}

async function testProducts() {
  console.log('\n── PRODUCTS ─────────────────────────────────────────')

  const list = await req('GET', '/api/products?limit=5', null, 200)
  log('GET /api/products → 200', list.ok, `total: ${list.data?.total}`)

  // Get a category id first
  const cats = await req('GET', '/api/categories', null, 200)
  const categoryId = cats.data?.categories?.[0]?.id || cats.data?.[0]?.id

  const create = await req('POST', '/api/products', {
    name: 'Test Dress', sku: `TEST-${Date.now()}`,
    price: '1500', status: 'active', categoryId,
  }, 201)
  log('POST /api/products → 201', create.ok, `id: ${create.data?.id}`)
  const productId = create.data?.id

  if (productId) {
    const get = await req('GET', `/api/products/${productId}`, null, 200)
    log(`GET /api/products/${productId} → 200`, get.ok)

    const update = await req('PUT', `/api/products/${productId}`, {
      name: 'Test Dress Updated', sku: `TEST-${Date.now()}`, price: '1800', status: 'active',
    }, 200)
    log(`PUT /api/products/${productId} → 200`, update.ok)

    // Images listing
    const imgs = await req('GET', `/api/products/${productId}/images`, null, 200)
    log(`GET /api/products/${productId}/images → 200`, imgs.ok, `count: ${imgs.data?.images?.length}`)
  }

  return { productId, list: list.data?.products || [] }
}

async function testOrders(customerId, productId) {
  console.log('\n── ORDERS ───────────────────────────────────────────')

  if (!customerId || !productId) {
    log('Orders test skipped', false, 'Need valid customerId and productId')
    return null
  }

  const list = await req('GET', '/api/orders', null, 200)
  log('GET /api/orders → 200', list.ok, `total: ${list.data?.pagination?.total}`)

  const create = await req('POST', '/api/orders', {
    customerId,
    status: 'pending',
    notes: 'Test order from script',
    shipping: 50, discount: 0,
    items: [{ productId, quantity: 2, price: 1500 }],
  }, 201)
  log('POST /api/orders → 201', create.ok, create.ok ? `order: ${create.data?.orderNumber}` : `HTTP ${create.status}: ${JSON.stringify(create.data)}`)
  const orderId = create.data?.id

  if (orderId) {
    const get = await req('GET', `/api/orders/${orderId}`, null, 200)
    log(`GET /api/orders/${orderId} → 200`, get.ok)

    const patch = await req('PATCH', `/api/orders/${orderId}`, { status: 'design_in_progress' }, 200)
    log(`PATCH /api/orders/${orderId} status → 200`, patch.ok)
  }

  return orderId
}

async function testFinance() {
  console.log('\n── FINANCE ──────────────────────────────────────────')

  const list = await req('GET', '/api/finance', null, 200)
  log('GET /api/finance → 200', list.ok, `total: ${list.data?.total}`)

  const create = await req('POST', '/api/finance', {
    type: 'expense', category: 'material_purchase',
    amount: 500, title: 'Test material purchase', description: 'Test purchase',
    transactionDate: new Date().toISOString(),
  }, 201)
  log('POST /api/finance (expense) → 201', create.ok, create.ok ? `id: ${create.data?.id}` : `HTTP ${create.status}: ${create.data?.error}`)

  const createIncome = await req('POST', '/api/finance', {
    type: 'income', category: 'product_sale',
    amount: 2000, title: 'Test sale income', description: 'Test income',
    transactionDate: new Date().toISOString(),
  }, 201)
  log('POST /api/finance (income) → 201', createIncome.ok, createIncome.ok ? '' : `HTTP ${createIncome.status}: ${createIncome.data?.error}`)

  if (create.data?.id) {
    const del = await req('DELETE', `/api/finance?id=${create.data.id}`, null, 200)
    log(`DELETE /api/finance?id=${create.data.id} → 200`, del.ok)
  }
}

async function testPayroll() {
  console.log('\n── PAYROLL ──────────────────────────────────────────')

  const list = await req('GET', '/api/payroll', null, 200)
  log('GET /api/payroll → 200', list.ok, `total: ${list.data?.total}`)

  const users = await req('GET', '/api/users', null, 200)
  const staffId = users.data?.users?.[0]?.id

  if (staffId) {
    const create = await req('POST', '/api/payroll', {
      userId: staffId, periodStart: '2025-04-01', periodEnd: '2025-04-30',
      baseSalary: 8000, bonus: 500, taxDeduction: 200, notes: 'Test payroll',
    }, 201)
    log('POST /api/payroll → 201', create.ok, create.ok ? `id: ${create.data?.id}` : `HTTP ${create.status}: ${create.data?.error}`)

    if (create.data?.id) {
      const approve = await req('PATCH', '/api/payroll', { id: create.data.id, status: 'approved' }, 200)
      log(`PATCH /api/payroll approve → 200`, approve.ok, approve.ok ? '' : `HTTP ${approve.status}: ${approve.data?.error}`)
    }
  } else {
    log('POST /api/payroll skipped', false, 'No staff user found')
  }
}

async function testInventory() {
  console.log('\n── INVENTORY ────────────────────────────────────────')

  const list = await req('GET', '/api/inventory', null, 200)
  log('GET /api/inventory → 200', list.ok, `count: ${list.data?.inventory?.length ?? list.data?.length}`)
}

async function testUsers() {
  console.log('\n── USERS ────────────────────────────────────────────')

  const list = await req('GET', '/api/users', null, 200)
  log('GET /api/users → 200', list.ok, `count: ${list.data?.users?.length}`)
}

async function testUpload() {
  console.log('\n── UPLOAD ───────────────────────────────────────────')

  // Test with a tiny 1x1 PNG (no sharp needed for this test)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=='
  const bytes = Buffer.from(pngBase64, 'base64')
  const blob = new Blob([bytes], { type: 'image/png' })
  const form = new FormData()
  form.append('files', blob, 'test.png')
  form.append('folder', 'test')

  const res = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    headers: { Cookie: SESSION_COOKIE },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  log('POST /api/upload → 200', res.status === 200, `files: ${data?.files?.length}`)
}

// ── Runner ────────────────────────────────────────────────────────────────────

async function run() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Fikir Design Dashboard — Workflow Tests')
  console.log(`  Target: ${BASE}`)
  console.log('═══════════════════════════════════════════════════════')

  try {
    const authOk = await testAuth()
    if (!authOk) {
      console.log('\n⚠️  Login failed — check credentials (default: admin / admin123)')
      console.log('   Remaining tests may fail due to 401 responses.\n')
    }

    await testUsers()
    await testInventory()

    const { productId, list: productList } = await testProducts()
    const firstProductId = productId || productList?.[0]?.id

    // Create a temp customer for order test
    const custCreate = await req('POST', '/api/customers', {
      firstName: 'OrderTest', lastName: 'Customer',
      phone: '+251900000099', status: 'active',
    }, 201)
    const tempCustomerId = custCreate.data?.id

    await testOrders(tempCustomerId, firstProductId)
    await testFinance()
    await testPayroll()
    await testUpload()

    // Cleanup temp customer
    if (tempCustomerId) await req('DELETE', `/api/customers/${tempCustomerId}`, null, 200)
    // Cleanup test product
    if (productId) await req('DELETE', `/api/products/${productId}`, null, 200)

  } catch (err) {
    console.error('\n💥 Unexpected error:', err.message)
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`)
  console.log('═══════════════════════════════════════════════════════')

  if (failed > 0) {
    console.log('\nFailed tests:')
    results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.label}${r.detail ? ` — ${r.detail}` : ''}`))
  }

  process.exit(failed > 0 ? 1 : 0)
}

run()

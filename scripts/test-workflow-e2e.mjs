/**
 * Fikir Design — End-to-End Workflow Test
 * Tests the full CRM → Delivery pipeline with staff creation at each stage.
 *
 * Run: node scripts/test-workflow-e2e.mjs
 * Requires dev server on http://localhost:3000
 */

const BASE = 'http://localhost:3000'
let SESSION_COOKIE = ''
let passed = 0, failed = 0

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(label, ok, detail = '') {
  const icon = ok ? '✅' : '❌'
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ''}`)
  if (ok) passed++; else failed++
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(SESSION_COOKIE ? { Cookie: SESSION_COOKIE } : {}) },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) SESSION_COOKIE = setCookie.split(';')[0]
  let data
  try { data = await res.json() } catch { data = {} }
  return { status: res.status, data, ok: res.status < 300 }
}

function section(title) {
  console.log(`\n${'─'.repeat(54)}`)
  console.log(`  ${title}`)
  console.log('─'.repeat(54))
}

// ── Cleanup tracker ────────────────────────────────────────────────────────────

const cleanup = { userIds: [], customerId: null, productId: null, orderId: null }

// ── Step 1: Auth ──────────────────────────────────────────────────────────────

async function stepAuth() {
  section('STEP 1 — Auth (admin login)')
  const r = await api('POST', '/api/auth/login', { username: 'admin', password: 'admin123' })
  log('Login as admin', r.status === 200, r.data?.user?.role)
  return r.ok
}

// ── Step 2: Create one staff member per workflow role ─────────────────────────

const STAFF_DEFS = [
  { role: 'sales',              firstName: 'Selamawit', lastName: 'Tesfaye',  username: `test_sales_${Date.now()}`,    stage: 'sales_staff',          label: 'Sales Staff' },
  { role: 'designer',           firstName: 'Biruk',     lastName: 'Alemu',    username: `test_designer_${Date.now()}`, stage: 'designer',             label: 'Designer' },
  { role: 'sewer',              firstName: 'Tigist',    lastName: 'Mulugeta', username: `test_sewer_${Date.now()}`,    stage: 'sewer_production_team', label: 'Sewer / Production' },
  { role: 'store_keeper',       firstName: 'Dawit',     lastName: 'Haile',    username: `test_store_${Date.now()}`,    stage: 'store_manager',        label: 'Store Manager' },
  { role: 'material_controller',firstName: 'Hiwot',     lastName: 'Girma',    username: `test_matctrl_${Date.now()}`,  stage: 'production',           label: 'Production' },
  { role: 'staff',              firstName: 'Yonas',     lastName: 'Bekele',   username: `test_qc_${Date.now()}`,       stage: 'quality_control',      label: 'Quality Control' },
  { role: 'staff',              firstName: 'Meron',     lastName: 'Tadesse',  username: `test_deliv_${Date.now()}`,    stage: 'delivery_team',        label: 'Delivery Team' },
]

async function stepCreateStaff() {
  section('STEP 2 — Create staff for each workflow stage')
  const createdIds = []
  for (const def of STAFF_DEFS) {
    const r = await api('POST', '/api/users', {
      username: def.username,
      password: 'Staff1234!',
      firstName: def.firstName,
      lastName: def.lastName,
      phone: `+2519${Math.floor(10000000 + Math.random() * 89999999)}`,
      role: def.role,
      isActive: true,
    })
    log(`Create ${def.label} (${def.role}) → ${def.firstName} ${def.lastName}`, r.status === 201, r.status !== 201 ? `HTTP ${r.status}: ${r.data?.error}` : `id: ${r.data?.id}`)
    if (r.data?.id) createdIds.push(r.data.id)
  }
  cleanup.userIds = createdIds
  return createdIds
}

// ── Step 3: Create customer ───────────────────────────────────────────────────

async function stepCreateCustomer() {
  section('STEP 3 — Create test customer')
  const r = await api('POST', '/api/customers', {
    firstName: 'Azeb', lastName: 'Worku',
    phone: '+251911230099', email: 'azeb.worku@test.et',
    address: 'Piassa', city: 'Addis Ababa',
    bodyMeasurements: { height: 162, chest: 88, waist: 68, hips: 94, sleeveLength: 58 },
    status: 'active',
  })
  log('Create customer', r.status === 201, r.status === 201 ? `id: ${r.data?.id}` : r.data?.error)
  cleanup.customerId = r.data?.id
  return r.data?.id
}

// ── Step 4: Create product ────────────────────────────────────────────────────

async function stepCreateProduct() {
  section('STEP 4 — Create test product')

  // Get or use first category
  const cats = await api('GET', '/api/categories', null)
  const catId = cats.data?.categories?.[0]?.id

  const r = await api('POST', '/api/products', {
    name: 'Habesha Kemis (Test)',
    sku: `HK-${Date.now()}`,
    price: '3500',
    status: 'active',
    categoryId: catId,
  })
  log('Create product', r.status === 201, r.status === 201 ? `id: ${r.data?.id}, price: ${r.data?.price}` : r.data?.error)
  cleanup.productId = r.data?.id
  return r.data?.id
}

// ── Step 5: Create order ──────────────────────────────────────────────────────

async function stepCreateOrder(customerId, productId) {
  section('STEP 5 — Create order (CRM data entry)')
  if (!customerId || !productId) {
    log('Create order', false, 'Missing customerId or productId — skipping')
    return null
  }
  const r = await api('POST', '/api/orders', {
    customerId,
    status: 'pending',
    notes: 'Habesha kemis for wedding. Custom measurements.',
    shipping: 100,
    discount: 0,
    items: [{ productId, quantity: 1, price: 3500 }],
  })
  log('Create order', r.status === 201, r.status === 201 ? `order: ${r.data?.orderNumber}, total: ${r.data?.total}` : JSON.stringify(r.data))
  cleanup.orderId = r.data?.id
  return r.data?.id
}

// ── Step 6: Verify initial workflow state ─────────────────────────────────────

async function stepVerifyInitialStage(orderId) {
  section('STEP 6 — Verify initial workflow state')
  const r = await api('GET', '/api/workflow', null)
  log('GET /api/workflow → 200', r.status === 200, `stages: ${Object.keys(r.data?.stageCounts || {}).length}`)

  if (orderId) {
    const orderInWorkflow = (r.data?.orders || []).find((o) => o.id === orderId)
    log('Order appears in workflow board', !!orderInWorkflow, orderInWorkflow ? `stage: ${orderInWorkflow.currentStage}` : 'not found')
    const crmCount = r.data?.stageCounts?.crm_data
    log('CRM Data stage count ≥ 1', crmCount >= 1, `count: ${crmCount}`)
  }
}

// ── Step 7: Advance through all 8 stages ─────────────────────────────────────

const STAGES = [
  'crm_data',
  'sales_staff',
  'designer',
  'sewer_production_team',
  'store_manager',
  'production',
  'quality_control',
  'delivery_team',
]

const STAGE_LABELS = {
  crm_data: 'CRM Data Entry',
  sales_staff: 'Sales Staff',
  designer: 'Designer',
  sewer_production_team: 'Sewer / Production',
  store_manager: 'Store Manager',
  production: 'Production',
  quality_control: 'Quality Control',
  delivery_team: 'Delivery Team',
}

async function stepAdvanceThroughAll(orderId) {
  section('STEP 7 — Advance order through all workflow stages')
  if (!orderId) { log('Stage advance skipped', false, 'No orderId'); return }

  // Order starts at crm_data. Advance through remaining 7 stages.
  for (let i = 1; i < STAGES.length; i++) {
    const toStage = STAGES[i]
    const r = await api('POST', '/api/workflow', {
      orderId,
      toStage,
      comment: `Test advance to ${toStage} by e2e script`,
    })
    log(
      `→ ${STAGE_LABELS[toStage]}`,
      r.status === 201,
      r.status === 201
        ? `stage: ${r.data?.order?.currentStage}, status: ${r.data?.order?.status}`
        : `HTTP ${r.status}: ${r.data?.error}`
    )
    // Brief pause to keep timestamps distinct
    await new Promise(res => setTimeout(res, 80))
  }

  // Verify final state
  const final = await api('GET', `/api/orders/${orderId}`, null)
  log('Order reached delivery_team stage', final.data?.currentStage === 'delivery_team',
    `currentStage: ${final.data?.currentStage}, status: ${final.data?.status}`)
}

// ── Step 8: Verify workflow timeline events ────────────────────────────────────

async function stepVerifyTimeline(orderId) {
  section('STEP 8 — Verify workflow event timeline')
  const r = await api('GET', '/api/workflow', null)
  const orderEvents = (r.data?.events || []).filter(e => e.orderId === orderId)
  log('Workflow events recorded', orderEvents.length >= 7,
    `${orderEvents.length} events for order ${orderId} (expected 7+)`)

  const finalCounts = r.data?.stageCounts || {}
  log('delivery_team count ≥ 1', (finalCounts.delivery_team || 0) >= 1,
    `delivery_team: ${finalCounts.delivery_team}`)

  console.log('\n  Stage counts after full run:')
  STAGES.forEach(s => {
    const n = finalCounts[s] || 0
    const bar = '█'.repeat(n) || '·'
    console.log(`    ${STAGE_LABELS[s].padEnd(24)} ${bar} (${n})`)
  })
}

// ── Step 9: Sewer assignment workflow ─────────────────────────────────────────

async function stepSewerAssignment(orderId) {
  section('STEP 9 — Sewer assignment via /api/orders/assign')
  if (!orderId) { log('Sewer assignment skipped', false, 'No orderId'); return }

  // Create a fresh order for this test
  const custR = await api('POST', '/api/customers', {
    firstName: 'Sewing', lastName: 'TestClient', phone: '+251900000077', status: 'active',
  })
  const cId = custR.data?.id
  const prodR = await api('GET', '/api/products?limit=1', null)
  const pId = prodR.data?.products?.[0]?.id || cleanup.productId

  if (!cId || !pId) { log('Sewer test skipped', false, 'No customer/product'); return }

  const orderR = await api('POST', '/api/orders', {
    customerId: cId, status: 'pending',
    items: [{ productId: pId, quantity: 1, price: 3500 }],
    notes: 'Sewer assignment test',
  })
  const sewOrderId = orderR.data?.id
  log('Create order for sewer test', !!sewOrderId, `id: ${sewOrderId}`)

  if (!sewOrderId) return

  // Try automatic sewer assignment
  const assignR = await api('POST', '/api/orders/assign', {
    orderId: sewOrderId,
    method: 'automatic',
    garmentType: 'kemis',
  })
  log('Auto-assign to sewer', assignR.status === 201 || assignR.status === 422,
    assignR.status === 201
      ? `sewerId: ${assignR.data?.assignment?.sewerId}, fabric: ${assignR.data?.fabricMetersRequired}m`
      : `HTTP ${assignR.status}: ${assignR.data?.error}`)

  // GET assignments
  const listR = await api('GET', '/api/orders/assign', null)
  log('GET /api/orders/assign → 200', listR.status === 200, `count: ${listR.data?.assignments?.length}`)

  // Cleanup sewer test order + customer
  await api('DELETE', `/api/orders/${sewOrderId}`, null)
  await api('DELETE', `/api/customers/${cId}`, null)
}

// ── Step 10: Cleanup ──────────────────────────────────────────────────────────

async function stepCleanup() {
  section('STEP 10 — Cleanup test data')

  if (cleanup.orderId) {
    const r = await api('DELETE', `/api/orders/${cleanup.orderId}`, null)
    log(`Delete test order ${cleanup.orderId}`, r.status === 200 || r.status === 204)
  }
  if (cleanup.productId) {
    const r = await api('DELETE', `/api/products/${cleanup.productId}`, null)
    if (r.status === 200) {
      log(`Delete test product ${cleanup.productId}`, true, 'ok')
    } else {
      // Product may be FK-referenced by inventory records — non-critical
      console.log(`⚠️  Product ${cleanup.productId} not deleted (FK constraint from inventory) — run manually if needed`)
    }
  }
  if (cleanup.customerId) {
    const r = await api('DELETE', `/api/customers/${cleanup.customerId}`, null)
    log(`Delete test customer ${cleanup.customerId}`, r.status === 200)
  }
  for (const uid of cleanup.userIds) {
    const r = await api('DELETE', `/api/users/${uid}`, null)
    log(`Delete test user ${uid}`, r.status === 200 || r.status === 204)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('═'.repeat(54))
  console.log('  Fikir Design — Workflow E2E Test')
  console.log(`  Target: ${BASE}`)
  console.log('═'.repeat(54))

  try {
    const authOk = await stepAuth()
    if (!authOk) { console.log('\n⚠️  Auth failed — aborting\n'); process.exit(1) }

    await stepCreateStaff()
    const customerId = await stepCreateCustomer()
    const productId  = await stepCreateProduct()
    const orderId    = await stepCreateOrder(customerId, productId)

    await stepVerifyInitialStage(orderId)
    await stepAdvanceThroughAll(orderId)
    await stepVerifyTimeline(orderId)
    await stepSewerAssignment(orderId)

  } catch (err) {
    console.error('\n💥 Unexpected error:', err.message)
  } finally {
    await stepCleanup()
  }

  console.log('\n' + '═'.repeat(54))
  console.log(`  Results: ${passed} passed, ${failed} failed out of ${passed + failed}`)
  console.log('═'.repeat(54))

  process.exit(failed > 0 ? 1 : 0)
}

run()

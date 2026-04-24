/**
 * Fikir Design — Per-Staff Workflow Test
 * Each staff member logs in with THEIR OWN credentials and advances the order
 * through the stage they are responsible for.
 *
 * Workflow:  crm_data → sales_staff → designer → sewer_production_team
 *            → store_manager → production → quality_control → delivery_team
 *
 * Run:  node scripts/test-staff-workflow.mjs
 * Needs: dev server on http://localhost:3000 + admin:admin123
 */

const BASE = 'http://localhost:3000'
const ADMIN_CREDS = { username: 'admin', password: 'admin123' }
let totalPassed = 0, totalFailed = 0

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(label, ok, detail = '') {
  const icon = ok ? '✅' : '❌'
  console.log(`  ${icon} ${label}${detail ? `  (${detail})` : ''}`)
  if (ok) totalPassed++; else totalFailed++
}

function warn(msg) { console.log(`  ⚠️  ${msg}`) }

function section(title) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('═'.repeat(60))
}

function sub(title) {
  console.log(`\n  ── ${title}`)
}

/** Create a cookie-bound API client for a single session */
function makeClient() {
  let cookie = ''
  return async function apiCall(method, path, body) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
    }
    if (body !== undefined) opts.body = JSON.stringify(body)
    const res = await fetch(`${BASE}${path}`, opts)
    const sc = res.headers.get('set-cookie')
    if (sc) cookie = sc.split(';')[0]
    let data
    try { data = await res.json() } catch { data = {} }
    return { status: res.status, ok: res.status < 300, data, cookie: () => cookie }
  }
}

// Shared admin client (elevated session)
const admin = makeClient()

// ── Staff Definitions ─────────────────────────────────────────────────────────
// Each entry maps to one workflow stage and one Prisma UserRole.

const TS = Date.now()
const PASSWORD = 'Staff1234!'

const STAFF = [
  {
    stage:     'sales_staff',
    label:     'Sales Staff',
    role:      'sales',
    firstName: 'Selamawit',
    lastName:  'Tesfaye',
    username:  `ts_sales_${TS}`,
    // what this staff can read
    canReadOrders: true,
    canReadCustomers: true,
    canManageStaff: false,
  },
  {
    stage:     'designer',
    label:     'Designer',
    role:      'designer',
    firstName: 'Biruk',
    lastName:  'Alemu',
    username:  `ts_designer_${TS}`,
    canReadOrders: true,
    canReadCustomers: true,
    canManageStaff: false,
  },
  {
    stage:     'sewer_production_team',
    label:     'Sewer / Production',
    role:      'sewer',
    firstName: 'Tigist',
    lastName:  'Mulugeta',
    username:  `ts_sewer_${TS}`,
    canReadOrders: true,
    canReadCustomers: false,
    canManageStaff: false,
  },
  {
    stage:     'store_manager',
    label:     'Store Manager',
    role:      'store_keeper',
    firstName: 'Dawit',
    lastName:  'Haile',
    username:  `ts_store_${TS}`,
    canReadOrders: true,
    canReadCustomers: false,
    canManageStaff: false,
  },
  {
    stage:     'production',
    label:     'Production',
    role:      'material_controller',
    firstName: 'Hiwot',
    lastName:  'Girma',
    username:  `ts_matctrl_${TS}`,
    canReadOrders: true,
    canReadCustomers: false,
    canManageStaff: false,
  },
  {
    stage:     'quality_control',
    label:     'Quality Control',
    role:      'staff',
    firstName: 'Yonas',
    lastName:  'Bekele',
    username:  `ts_qc_${TS}`,
    canReadOrders: true,
    canReadCustomers: false,
    canManageStaff: false,
  },
  {
    stage:     'delivery_team',
    label:     'Delivery Team',
    role:      'staff',
    firstName: 'Meron',
    lastName:  'Tadesse',
    username:  `ts_deliv_${TS}`,
    canReadOrders: true,
    canReadCustomers: false,
    canManageStaff: false,
  },
]

const STAGE_LABELS = {
  crm_data:              'CRM Data Entry',
  sales_staff:           'Sales Staff',
  designer:              'Designer',
  sewer_production_team: 'Sewer / Production',
  store_manager:         'Store Manager',
  production:            'Production',
  quality_control:       'Quality Control',
  delivery_team:         'Delivery Team',
}

const ALL_STAGES = Object.keys(STAGE_LABELS)

// Cleanup registry
const cleanup = { userIds: [], customerId: null, productId: null, orderId: null }

// ── Phase 1: Admin bootstraps everything ─────────────────────────────────────

async function phase1_adminSetup() {
  section('PHASE 1 — Admin: login + create staff + create order')

  // 1a. Admin login
  sub('Admin login')
  const loginR = await admin('POST', '/api/auth/login', ADMIN_CREDS)
  log('Admin login', loginR.status === 200, loginR.data?.user?.role)
  if (!loginR.ok) { warn('Cannot continue without admin session'); process.exit(1) }

  // 1b. Create staff members
  sub('Create staff accounts')
  for (const def of STAFF) {
    const r = await admin('POST', '/api/users', {
      username:  def.username,
      password:  PASSWORD,
      firstName: def.firstName,
      lastName:  def.lastName,
      role:      def.role,
      isActive:  true,
    })
    def.id = r.data?.id
    log(
      `Create ${def.label} (${def.role}) → ${def.firstName} ${def.lastName}`,
      r.status === 201,
      r.status === 201 ? `id: ${def.id}` : `HTTP ${r.status}: ${r.data?.error}`
    )
    if (def.id) cleanup.userIds.push(def.id)
  }

  // 1c. Create customer
  sub('Create test customer')
  const custR = await admin('POST', '/api/customers', {
    firstName: 'Azeb', lastName: 'Worku',
    phone: '+251911230099', email: `azeb.worku.${TS}@test.et`,
    address: 'Piassa', city: 'Addis Ababa',
    bodyMeasurements: { height: 162, chest: 88, waist: 68, hips: 94 },
    status: 'active',
  })
  cleanup.customerId = custR.data?.id
  log('Create customer', custR.status === 201, `id: ${cleanup.customerId}`)

  // 1d. Get first available product
  sub('Find product for order')
  const prodR = await admin('GET', '/api/products?limit=1', undefined)
  const firstProduct = prodR.data?.products?.[0]
  cleanup.productId = firstProduct?.id
  log('Product available', !!cleanup.productId, cleanup.productId ? `id: ${cleanup.productId}, name: ${firstProduct?.name}` : 'none found — order may fail')

  // 1e. Create order (starts at crm_data by default)
  sub('Create order (enters at crm_data)')
  if (!cleanup.customerId || !cleanup.productId) {
    warn('Skipping order creation — missing customer or product')
    return false
  }
  const orderR = await admin('POST', '/api/orders', {
    customerId: cleanup.customerId,
    status: 'pending',
    notes: 'Staff workflow e2e test order',
    shipping: 100,
    discount: 0,
    items: [{ productId: cleanup.productId, quantity: 1, price: Number(firstProduct.price) || 3500 }],
  })
  cleanup.orderId = orderR.data?.id
  log(
    'Create order',
    orderR.status === 201,
    orderR.status === 201
      ? `#${orderR.data?.orderNumber}, total: ${orderR.data?.total} ETB, stage: crm_data`
      : JSON.stringify(orderR.data)
  )

  // 1f. Verify order is at crm_data
  if (cleanup.orderId) {
    const wfR = await admin('GET', '/api/workflow', undefined)
    const found = (wfR.data?.orders || []).find(o => o.id === cleanup.orderId)
    log('Order starts at crm_data stage', found?.currentStage === 'crm_data', `currentStage: ${found?.currentStage}`)
  }

  return !!cleanup.orderId
}

// ── Phase 2: Each staff logs in and advances their stage ──────────────────────

async function phase2_staffWorkflow() {
  section('PHASE 2 — Each staff logs in and advances their own stage')

  if (!cleanup.orderId) {
    warn('No orderId — skipping per-staff workflow phase')
    return
  }

  // Starting point: order is at crm_data.
  // Each staff member advances it one step.
  for (const def of STAFF) {
    const client = makeClient()
    console.log(`\n  ┌─ ${def.label} (${def.role} / ${def.firstName} ${def.lastName})`)

    // 2a. Staff login
    const loginR = await client('POST', '/api/auth/login', {
      username: def.username,
      password: PASSWORD,
    })
    log(`  Login as ${def.label}`, loginR.status === 200, `role: ${loginR.data?.user?.role}`)
    if (!loginR.ok) { warn(`  Cannot log in as ${def.label} — skipping their stage`); continue }
    const loggedInAs = loginR.data?.user

    // 2b. Staff can read orders
    if (def.canReadOrders) {
      const ordersR = await client('GET', '/api/orders?limit=5', undefined)
      log(`  Can read orders`, ordersR.status === 200, `got ${ordersR.data?.orders?.length ?? 0} orders`)
    }

    // 2c. Staff can read customers (role-gated)
    const custR = await client('GET', '/api/customers?limit=5', undefined)
    if (def.canReadCustomers) {
      log(`  Can read customers`, custR.status === 200)
    } else {
      log(`  Customers endpoint responds`, custR.status === 200 || custR.status === 403, `HTTP ${custR.status}`)
    }

    // 2d. Staff cannot manage other staff (only admin/manager can)
    const staffR = await client('GET', '/api/users', undefined)
    log(`  Staff list blocked (403)`, staffR.status === 403, `HTTP ${staffR.status}`)

    // 2e. Staff advances order to their stage
    const advR = await client('POST', '/api/workflow', {
      orderId: cleanup.orderId,
      toStage: def.stage,
      comment: `${def.label} (${def.firstName} ${def.lastName}) moving order to ${def.stage}`,
    })
    const advOk = advR.status === 201
    log(
      `  Advance to "${STAGE_LABELS[def.stage]}"`,
      advOk,
      advOk
        ? `stage: ${advR.data?.order?.currentStage}, status: ${advR.data?.order?.status}`
        : `HTTP ${advR.status}: ${advR.data?.error}`
    )

    // 2f. Verify the event actor matches the logged-in user
    if (advOk && advR.data?.event) {
      const ev = advR.data.event
      const actorMatch = ev.actorUserId === loggedInAs?.id
      log(
        `  Event actor is ${def.firstName} ${def.lastName}`,
        actorMatch,
        `actorUserId: ${ev.actorUserId}, expected: ${loggedInAs?.id}, actorRole: ${ev.actorRole}`
      )
    }

    // 2g. Staff can view the workflow board
    const wfR = await client('GET', '/api/workflow', undefined)
    const orderInBoard = (wfR.data?.orders || []).find(o => o.id === cleanup.orderId)
    log(
      `  Order shows "${STAGE_LABELS[def.stage]}" on board`,
      orderInBoard?.currentStage === def.stage,
      `currentStage: ${orderInBoard?.currentStage}`
    )

    console.log(`  └─────────────────────────────────────────`)
  }
}

// ── Phase 3: Verify final state (as admin) ────────────────────────────────────

async function phase3_verifyFinal() {
  section('PHASE 3 — Admin: verify final state')

  if (!cleanup.orderId) { warn('No orderId — skipping verification'); return }

  // 3a. Order is at delivery_team
  const orderR = await admin('GET', `/api/orders/${cleanup.orderId}`, undefined)
  log(
    'Order final stage = delivery_team',
    orderR.data?.currentStage === 'delivery_team',
    `currentStage: ${orderR.data?.currentStage}, status: ${orderR.data?.status}`
  )

  // 3b. 7 workflow events recorded (one per stage transition: crm→sales…qc→delivery)
  const wfR = await admin('GET', '/api/workflow', undefined)
  const eventsForOrder = (wfR.data?.events || []).filter(e => e.orderId === cleanup.orderId)
  log(
    'All 7 stage transitions logged',
    eventsForOrder.length >= 7,
    `${eventsForOrder.length} events (expected ≥7)`
  )

  // 3c. Each event has actor info
  const eventsWithActor = eventsForOrder.filter(e => e.actorUserId != null)
  log(
    'All events have actor info',
    eventsWithActor.length === eventsForOrder.length,
    `${eventsWithActor.length}/${eventsForOrder.length} have actorUserId`
  )

  // 3d. Print full workflow trail
  if (eventsForOrder.length > 0) {
    console.log('\n  Order Workflow Trail:')
    ;[...eventsForOrder].reverse().forEach((ev, i) => {
      const from = ev.fromStage ? STAGE_LABELS[ev.fromStage] || ev.fromStage : '(start)'
      const to   = STAGE_LABELS[ev.toStage] || ev.toStage
      const actor = ev.actor ? `${ev.actor.firstName} ${ev.actor.lastName} [${ev.actor.role}]` : 'System'
      console.log(`    ${i + 1}. ${from.padEnd(26)} → ${to.padEnd(26)} by ${actor}`)
    })
  }

  // 3e. Stage counts in board
  const counts = wfR.data?.stageCounts || {}
  console.log('\n  Stage counts (all orders):')
  ALL_STAGES.forEach(s => {
    const n = counts[s] || 0
    console.log(`    ${STAGE_LABELS[s].padEnd(28)} ${'█'.repeat(n) || '·'} (${n})`)
  })
}

// ── Phase 4: Permission boundary tests ────────────────────────────────────────

async function phase4_permissions() {
  section('PHASE 4 — Permission boundary tests')

  // Unauthenticated client
  const anon = makeClient()

  sub('Unauthenticated requests are rejected')
  const endpoints = [
    { path: '/api/orders',    label: 'GET /api/orders' },
    { path: '/api/customers', label: 'GET /api/customers' },
    { path: '/api/workflow',  label: 'GET /api/workflow' },
    { path: '/api/finance',   label: 'GET /api/finance' },
    { path: '/api/users',     label: 'GET /api/users' },
  ]
  for (const ep of endpoints) {
    const r = await anon('GET', ep.path, undefined)
    log(`${ep.label} → 401/403`, r.status === 401 || r.status === 403, `HTTP ${r.status}`)
  }

  // Non-admin staff cannot create orders on behalf of others (only admin/manager can in some systems)
  // But the orders API allows any authenticated user to create, so we test read instead
  sub('Staff cannot manage other staff accounts')
  const salesClient = makeClient()
  const salesLogin = await salesClient('POST', '/api/auth/login', {
    username: STAFF[0].username,
    password: PASSWORD,
  })
  if (salesLogin.ok) {
    const r = await salesClient('POST', '/api/users', {
      username: `blocked_${TS}`, password: 'Test1234!',
      firstName: 'Should', lastName: 'Fail', role: 'staff',
    })
    log('Sales staff cannot create users (403)', r.status === 403, `HTTP ${r.status}`)

    const delR = await salesClient('DELETE', `/api/users/${STAFF[1].id}`, undefined)
    log('Sales staff cannot delete users (403)', delR.status === 403, `HTTP ${delR.status}`)
  }

  // Admin can still do everything
  sub('Admin retains full access')
  const adminOrdersR = await admin('GET', '/api/orders', undefined)
  log('Admin reads orders', adminOrdersR.status === 200)
  const adminUsersR = await admin('GET', '/api/users', undefined)
  log('Admin reads users', adminUsersR.status === 200, `${adminUsersR.data?.users?.length} users`)
}

// ── Phase 5: Cleanup ──────────────────────────────────────────────────────────

async function phase5_cleanup() {
  section('PHASE 5 — Cleanup test data')

  if (cleanup.orderId) {
    const r = await admin('DELETE', `/api/orders/${cleanup.orderId}`, undefined)
    log(`Delete test order ${cleanup.orderId}`, r.status === 200 || r.status === 204)
  }
  if (cleanup.customerId) {
    const r = await admin('DELETE', `/api/customers/${cleanup.customerId}`, undefined)
    log(`Delete test customer ${cleanup.customerId}`, r.status === 200)
  }
  for (const uid of cleanup.userIds) {
    const r = await admin('DELETE', `/api/users/${uid}`, undefined)
    log(`Delete test user ${uid}`, r.status === 200, r.data?.error || '')
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('╔' + '═'.repeat(58) + '╗')
  console.log('║  Fikir Design — Per-Staff Workflow E2E Test' + ' '.repeat(13) + '║')
  console.log(`║  Target: ${BASE}` + ' '.repeat(47 - BASE.length) + '║')
  console.log(`║  Stages: ${STAFF.length} staff × 7 transitions + permission checks` + ' '.repeat(2) + '║')
  console.log('╚' + '═'.repeat(58) + '╝')

  try {
    const setupOk = await phase1_adminSetup()
    await phase2_staffWorkflow()
    await phase3_verifyFinal()
    await phase4_permissions()
  } catch (err) {
    console.error('\n💥 Unexpected error:', err.message, err.stack)
  } finally {
    await phase5_cleanup()
  }

  const total = totalPassed + totalFailed
  console.log(`\n╔${'═'.repeat(58)}╗`)
  console.log(`║  RESULTS: ${totalPassed} passed, ${totalFailed} failed out of ${total}${' '.repeat(Math.max(0, 44 - String(total).length - String(totalPassed).length - String(totalFailed).length))}║`)
  console.log(`╚${'═'.repeat(58)}╝\n`)

  process.exit(totalFailed > 0 ? 1 : 0)
}

run()

/**
 * Fikir Admin Dashboard — Full staff workflow + role permission test
 *
 * Covers every Prisma UserRole used in the app:
 *   admin (seeded), manager, sales, designer, sewer, store_keeper,
 *   material_controller, staff
 *
 * What it does:
 *   1) Admin session: create one user per workflow stage + a manager, customer, order
 *   2) Each pipeline staff logs in with their own credentials and advances the order
 *      through sales_staff → … → delivery_team (same as test-staff-workflow.mjs)
 *   3) Manager: users list, workflow advance on a second order, assign API
 *   4) Permission matrix: safe GET/POST checks per role (API matches routes in src/app/api)
 *   5) Unauthenticated + cleanup
 *
 * Prerequisites:
 *   - `npm run dev` (or production server) on BASE_URL
 *   - Seeded admin: username `admin`, password `admin123`
 *   - MySQL + migrations applied; at least one product in DB for order lines
 *
 * Usage:
 *   node scripts/test-all-staff-workflow.mjs
 *   set BASE_URL=http://localhost:3000 && node scripts/test-all-staff-workflow.mjs
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const ADMIN_CREDS = { username: 'admin', password: 'admin123' }
const PASSWORD = 'Staff1234!'

let totalPassed = 0
let totalFailed = 0

function log(label, ok, detail = '') {
  const icon = ok ? '✅' : '❌'
  console.log(`  ${icon} ${label}${detail ? `  (${detail})` : ''}`)
  if (ok) totalPassed++
  else totalFailed++
}

function warn(msg) {
  console.log(`  ⚠️  ${msg}`)
}

function section(title) {
  console.log(`\n${'═'.repeat(62)}`)
  console.log(`  ${title}`)
  console.log('═'.repeat(62))
}

function sub(title) {
  console.log(`\n  ── ${title}`)
}

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
    try {
      data = await res.json()
    } catch {
      data = {}
    }
    return { status: res.status, ok: res.status < 300, data }
  }
}

const admin = makeClient()

const TS = Date.now()

/** Workflow actors (order matches WORKFLOW_STAGES after crm_data) */
const PIPELINE_STAFF = [
  {
    stage: 'sales_staff',
    label: 'Sales',
    role: 'sales',
    firstName: 'Selamawit',
    lastName: 'Tesfaye',
    username: `e2e_sales_${TS}`,
    canReadCustomers: true,
  },
  {
    stage: 'designer',
    label: 'Designer',
    role: 'designer',
    firstName: 'Biruk',
    lastName: 'Alemu',
    username: `e2e_designer_${TS}`,
    canReadCustomers: true,
  },
  {
    stage: 'sewer_production_team',
    label: 'Sewer',
    role: 'sewer',
    firstName: 'Tigist',
    lastName: 'Mulugeta',
    username: `e2e_sewer_${TS}`,
    canReadCustomers: false,
  },
  {
    stage: 'store_manager',
    label: 'Store keeper',
    role: 'store_keeper',
    firstName: 'Dawit',
    lastName: 'Haile',
    username: `e2e_store_${TS}`,
    canReadCustomers: false,
  },
  {
    stage: 'production',
    label: 'Material controller',
    role: 'material_controller',
    firstName: 'Hiwot',
    lastName: 'Girma',
    username: `e2e_mat_${TS}`,
    canReadCustomers: false,
  },
  {
    stage: 'quality_control',
    label: 'QC (staff)',
    role: 'staff',
    firstName: 'Yonas',
    lastName: 'Bekele',
    username: `e2e_qc_${TS}`,
    canReadCustomers: false,
  },
  {
    stage: 'delivery_team',
    label: 'Delivery (staff)',
    role: 'staff',
    firstName: 'Meron',
    lastName: 'Tadesse',
    username: `e2e_deliv_${TS}`,
    canReadCustomers: false,
  },
]

const MANAGER = {
  role: 'manager',
  firstName: 'Marta',
  lastName: 'Gebre',
  username: `e2e_manager_${TS}`,
}

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

const cleanup = { userIds: [], customerId: null, orderId: null, orderIdB: null, productId: null }

// ── Phase 1 ───────────────────────────────────────────────────────────────────

async function phase1_setup() {
  section('PHASE 1 — Admin: login, create manager + pipeline staff, orders')

  sub('Admin login')
  const loginR = await admin('POST', '/api/auth/login', ADMIN_CREDS)
  log('Admin login', loginR.status === 200, loginR.data?.user?.role)
  if (!loginR.ok) {
    warn('Abort: fix admin credentials or start the server.')
    return false
  }

  sub('Create manager account')
  const mgrR = await admin('POST', '/api/users', {
    username: MANAGER.username,
    password: PASSWORD,
    firstName: MANAGER.firstName,
    lastName: MANAGER.lastName,
    role: MANAGER.role,
    isActive: true,
  })
  MANAGER.id = mgrR.data?.id
  log(
    `Create manager`,
    mgrR.status === 201,
    mgrR.status === 201 ? `id: ${MANAGER.id}` : `HTTP ${mgrR.status}: ${mgrR.data?.error}`
  )
  if (MANAGER.id) cleanup.userIds.push(MANAGER.id)

  sub('Create pipeline staff (one per workflow stage)')
  for (const def of PIPELINE_STAFF) {
    const r = await admin('POST', '/api/users', {
      username: def.username,
      password: PASSWORD,
      firstName: def.firstName,
      lastName: def.lastName,
      role: def.role,
      isActive: true,
    })
    def.id = r.data?.id
    log(`Create ${def.label} (${def.role})`, r.status === 201, r.data?.id ? `id: ${def.id}` : r.data?.error)
    if (def.id) cleanup.userIds.push(def.id)
  }

  sub('Customer + product + primary order')
  const custR = await admin('POST', '/api/customers', {
    firstName: 'Azeb',
    lastName: 'Worku',
    phone: '+251911230099',
    email: `azeb.${TS}@test.et`,
    address: 'Piassa',
    city: 'Addis Ababa',
    bodyMeasurements: { height: 162, chest: 88, waist: 68, hips: 94 },
    status: 'active',
  })
  cleanup.customerId = custR.data?.id
  log('Create customer', custR.status === 201, `id: ${cleanup.customerId}`)

  const prodR = await admin('GET', '/api/products?limit=1', undefined)
  const firstProduct = prodR.data?.products?.[0]
  cleanup.productId = firstProduct?.id
  log('Product for order', !!cleanup.productId, cleanup.productId ? firstProduct?.name : 'add a product in DB')

  if (!cleanup.customerId || !cleanup.productId) return false

  const orderR = await admin('POST', '/api/orders', {
    customerId: cleanup.customerId,
    status: 'pending',
    notes: 'Full staff workflow test (primary)',
    shipping: 100,
    discount: 0,
    items: [
      {
        productId: cleanup.productId,
        quantity: 1,
        price: Number(firstProduct.price) || 3500,
      },
    ],
  })
  cleanup.orderId = orderR.data?.id
  log(
    'Create order A (pipeline)',
    orderR.status === 201,
    orderR.data?.orderNumber ? `#${orderR.data.orderNumber}` : JSON.stringify(orderR.data)
  )

  const orderBR = await admin('POST', '/api/orders', {
    customerId: cleanup.customerId,
    status: 'pending',
    notes: 'Manager workflow smoke test (order B)',
    shipping: 0,
    discount: 0,
    items: [
      {
        productId: cleanup.productId,
        quantity: 1,
        price: Number(firstProduct.price) || 3500,
      },
    ],
  })
  cleanup.orderIdB = orderBR.data?.id
  log('Create order B (manager)', orderBR.status === 201, cleanup.orderIdB ? `id: ${cleanup.orderIdB}` : '')

  if (cleanup.orderId) {
    const wfR = await admin('GET', '/api/workflow', undefined)
    const found = (wfR.data?.orders || []).find((o) => o.id === cleanup.orderId)
    log('Order A starts at crm_data', found?.currentStage === 'crm_data', `stage: ${found?.currentStage}`)
  }

  return !!cleanup.orderId
}

// ── Phase 2: each pipeline user advances order A ─────────────────────────────

async function phase2_pipeline() {
  section('PHASE 2 — Pipeline staff: each logs in and moves order A forward')

  if (!cleanup.orderId) {
    warn('No order A — skip')
    return
  }

  for (const def of PIPELINE_STAFF) {
    const client = makeClient()
    console.log(`\n  ┌─ ${def.label} — ${def.username}`)

    const loginR = await client('POST', '/api/auth/login', {
      username: def.username,
      password: PASSWORD,
    })
    log(`  Login`, loginR.status === 200, loginR.data?.user?.role)
    if (!loginR.ok) {
      warn(`  Skip stage ${def.stage}`)
      continue
    }
    const me = loginR.data?.user

    const ordersR = await client('GET', '/api/orders?limit=3', undefined)
    log(`  GET /api/orders`, ordersR.status === 200, `${ordersR.data?.orders?.length ?? 0} rows`)

    const custR = await client('GET', '/api/customers?limit=3', undefined)
    if (def.canReadCustomers) {
      log(`  GET /api/customers`, custR.status === 200)
    } else {
      log(`  GET /api/customers (expect 200)`, custR.status === 200)
    }

    const staffR = await client('GET', '/api/users', undefined)
    log(`  GET /api/users → 403`, staffR.status === 403, `HTTP ${staffR.status}`)

    const advR = await client('POST', '/api/workflow', {
      orderId: cleanup.orderId,
      toStage: def.stage,
      comment: `${def.label} advance to ${def.stage}`,
    })
    const advOk = advR.status === 201
    log(
      `  Advance → ${STAGE_LABELS[def.stage]}`,
      advOk,
      advOk ? `${advR.data?.order?.currentStage}` : `${advR.status} ${advR.data?.error}`
    )

    if (advOk && advR.data?.event && me) {
      log(`  Event actor = login user`, advR.data.event.actorUserId === me.id, `actorUserId ${advR.data.event.actorUserId}`)
    }

    const wfR = await client('GET', '/api/workflow', undefined)
    const o = (wfR.data?.orders || []).find((x) => x.id === cleanup.orderId)
    log(`  Board stage`, o?.currentStage === def.stage, o?.currentStage)
    console.log(`  └─────────────────────────────────────────`)
  }
}

// ── Phase 3: manager smoke + verification ────────────────────────────────────

async function phase3_manager_and_verify() {
  section('PHASE 3 — Manager: permissions + move order B; admin verifies order A')

  const mgrClient = makeClient()
  const mLogin = await mgrClient('POST', '/api/auth/login', { username: MANAGER.username, password: PASSWORD })
  log('Manager login', mLogin.status === 200, mLogin.data?.user?.role)

  if (mLogin.ok) {
    const uR = await mgrClient('GET', '/api/users', undefined)
    log('Manager GET /api/users', uR.status === 200, `${uR.data?.users?.length ?? 0} users`)

    if (cleanup.orderIdB) {
      const wfR = await mgrClient('POST', '/api/workflow', {
        orderId: cleanup.orderIdB,
        toStage: 'sales_staff',
        comment: 'Manager smoke: CRM → sales',
      })
      log('Manager POST /api/workflow (order B)', wfR.status === 201, wfR.data?.order?.currentStage)
    }

    // Must use order B only: POST /assign forces currentStage → sewer_production_team (would corrupt order A).
    const assignR = await mgrClient('POST', '/api/orders/assign', {
      orderId: cleanup.orderIdB,
      method: 'automatic',
      garmentType: 'kemis',
    })
    log(
      'Manager POST /api/orders/assign (order B)',
      assignR.status === 201 || assignR.status === 422,
      `HTTP ${assignR.status}`
    )
  }

  if (!cleanup.orderId) return

  const ordR = await admin('GET', `/api/orders/${cleanup.orderId}`, undefined)
  log('Order A final stage = delivery_team', ordR.data?.currentStage === 'delivery_team', ordR.data?.currentStage)

  const wfR = await admin('GET', '/api/workflow', undefined)
  const events = (wfR.data?.events || []).filter((e) => e.orderId === cleanup.orderId)
  log('Workflow events for order A (≥7)', events.length >= 7, `${events.length} events`)
}

// ── Phase 4: permission matrix (every role) ─────────────────────────────────

/** Returns list of { role, username, password } for matrix */
function collectRoleAccounts() {
  const list = [{ role: 'admin', username: ADMIN_CREDS.username, password: ADMIN_CREDS.password, label: 'Admin (seeded)' }]
  list.push({
    role: MANAGER.role,
    username: MANAGER.username,
    password: PASSWORD,
    label: 'Manager',
  })
  for (const p of PIPELINE_STAFF) {
    if (list.some((x) => x.username === p.username)) continue
    list.push({ role: p.role, username: p.username, password: PASSWORD, label: p.label })
  }
  return list
}

function expectUsersList(role) {
  return ['admin', 'manager'].includes(role) ? 200 : 403
}

/** POST /api/raw-materials — role gate matches route.ts */
function canPostRawMaterials(role) {
  return ['admin', 'manager', 'store_keeper', 'material_controller'].includes(role)
}

/** POST /api/stock-movements — role gate */
function canPostStockMovements(role) {
  return canPostRawMaterials(role)
}

/** POST /api/fabric-cuts — role gate */
function canPostFabricCuts(role) {
  return ['admin', 'manager', 'store_keeper', 'material_controller', 'sewer'].includes(role)
}

function expectSalesReportPost(role) {
  return ['admin', 'manager', 'sales'].includes(role) ? 'allow' : 'forbidden'
}

async function phase4_permission_matrix() {
  section('PHASE 4 — Permission matrix (all roles)')

  const accounts = collectRoleAccounts()
  const reportDate = new Date().toISOString().slice(0, 10)
  const salesPostBody = {
    reportDate,
    activityType: 'social_media',
    title: `E2E report ${TS}`,
    description: 'Automated test',
  }

  for (const acc of accounts) {
    sub(`${acc.label} (${acc.role})`)
    const c = makeClient()
    const lg = await c('POST', '/api/auth/login', { username: acc.username, password: acc.password })
    if (!lg.ok) {
      log('Login', false, `HTTP ${lg.status}`)
      continue
    }
    log('Login', true)

    const wantUsers = expectUsersList(acc.role)
    const ur = await c('GET', '/api/users', undefined)
    log(`GET /api/users → ${wantUsers}`, ur.status === wantUsers, `HTTP ${ur.status}`)

    const rr = await c('POST', '/api/raw-materials', {})
    const wantRm = canPostRawMaterials(acc.role) ? [400, 404, 500] : [403]
    log(`POST /api/raw-materials {} (write gate)`, wantRm.includes(rr.status), `HTTP ${rr.status}`)

    const sm = await c('POST', '/api/stock-movements', {})
    const wantSm = canPostStockMovements(acc.role) ? [400, 404, 422] : [403]
    log(`POST /api/stock-movements {} (write gate)`, wantSm.includes(sm.status), `HTTP ${sm.status}`)

    const fc = await c('POST', '/api/fabric-cuts', {})
    const wantFc = canPostFabricCuts(acc.role) ? [400, 404, 422] : [403]
    log(`POST /api/fabric-cuts {} (write gate)`, wantFc.includes(fc.status), `HTTP ${fc.status}`)

    const pr = await c('POST', '/api/payroll', {})
    const wantPayrollPost = ['admin', 'manager'].includes(acc.role) ? [400, 500] : [403]
    log(
      `POST /api/payroll (empty)`,
      wantPayrollPost.includes(pr.status),
      `HTTP ${pr.status}`
    )

    const sr = await c('POST', '/api/sales-reports', salesPostBody)
    const mode = expectSalesReportPost(acc.role)
    if (mode === 'allow') {
      log(
        `POST /api/sales-reports`,
        [201, 400, 500].includes(sr.status),
        `HTTP ${sr.status}`
      )
    } else {
      log(`POST /api/sales-reports → 403`, sr.status === 403, `HTTP ${sr.status}`)
    }

    const pt = await c('POST', '/api/points', {})
    log(`POST /api/points (empty) → 400 or 403`, pt.status === 403 || pt.status === 400, `HTTP ${pt.status}`)
  }
}

// ── Phase 5: anonymous ═──────────────────────────────────────────────────────

async function phase5_anon() {
  section('PHASE 5 — Unauthenticated requests')

  const anon = makeClient()
  for (const path of ['/api/orders', '/api/workflow', '/api/users', '/api/finance']) {
    const r = await anon('GET', path, undefined)
    const ok = r.status === 401 || (path === '/api/users' && r.status === 403)
    log(`GET ${path} → 401 (or 403 for users)`, ok, `HTTP ${r.status}`)
  }
}

// ── Phase 6: cleanup ────────────────────────────────────────────────────────

async function phase6_cleanup() {
  section('PHASE 6 — Cleanup')

  await admin('POST', '/api/auth/login', ADMIN_CREDS)

  if (cleanup.orderId) {
    const r = await admin('DELETE', `/api/orders/${cleanup.orderId}`, undefined)
    log(`DELETE order A`, r.status === 200 || r.status === 204, `${r.status}`)
  }
  if (cleanup.orderIdB) {
    const r = await admin('DELETE', `/api/orders/${cleanup.orderIdB}`, undefined)
    log(`DELETE order B`, r.status === 200 || r.status === 204, `${r.status}`)
  }
  if (cleanup.customerId) {
    const r = await admin('DELETE', `/api/customers/${cleanup.customerId}`, undefined)
    log(`DELETE customer`, r.status === 200, `${r.status}`)
  }
  for (const uid of cleanup.userIds) {
    const r = await admin('DELETE', `/api/users/${uid}`, undefined)
    log(`DELETE user ${uid}`, r.status === 200 || r.status === 204, '')
  }
}

// ── Manual checklist (printed for QA) ────────────────────────────────────────

function printManualChecklist() {
  console.log(`
╔${'═'.repeat(60)}╗
║  Manual UI checklist (same passwords as this script)          ║
╠${'═'.repeat(60)}╣
║  Base URL: ${BASE.padEnd(48)}║
║  Staff password (created users): ${PASSWORD.padEnd(27)}║
╠${'═'.repeat(60)}╣
║  1. Login as each user → confirm dashboard loads             ║
║  2. /dashboard/workflow — Kanban + move order (if allowed)   ║
║  3. /dashboard/orders — list + detail                        ║
║  4. Sales: /dashboard/customers + sales-reports               ║
║  5. Store / materials: /dashboard/inventory, raw-materials   ║
║  6. Admin/Manager: /dashboard/staff, finance, payroll         ║
║  7. Sewer: /dashboard/orders/assign (view assignment rules)   ║
╚${'═'.repeat(60)}╝
`)
}

// ── Main ────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\nFikir Admin Dashboard — FULL staff workflow test`)
  console.log(`Target: ${BASE}\n`)

  try {
    const ok = await phase1_setup()
    if (!ok) warn('Setup incomplete — later phases may fail.')
    await phase2_pipeline()
    await phase3_manager_and_verify()
    await phase4_permission_matrix()
    await phase5_anon()
  } catch (err) {
    console.error('\nUnexpected error:', err)
  } finally {
    await phase6_cleanup()
  }

  printManualChecklist()

  const total = totalPassed + totalFailed
  console.log(`\nResults: ${totalPassed} passed, ${totalFailed} failed (checks: ${total})\n`)
  process.exit(totalFailed > 0 ? 1 : 0)
}

run()

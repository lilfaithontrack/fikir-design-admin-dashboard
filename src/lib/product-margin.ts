/**
 * Catalog margin preview (ETB). Not a substitute for accounting ledgers.
 * estimatedProfit = selling price − COGS − default fees
 * where COGS = costPrice + estimatedMaterial + estimatedLabor (each optional).
 */
export type MarginInputs = {
  basePrice: number
  costPrice?: number | null
  defaultShippingFee?: number | null
  defaultServiceFee?: number | null
  estimatedLaborCost?: number | null
  estimatedMaterialCost?: number | null
}

export function computeProductMarginPreview(input: MarginInputs) {
  const price = Number.isFinite(input.basePrice) ? input.basePrice : 0
  const cost = n(input.costPrice)
  const ship = n(input.defaultShippingFee)
  const service = n(input.defaultServiceFee)
  const labor = n(input.estimatedLaborCost)
  const material = n(input.estimatedMaterialCost)

  const cogs = cost + material + labor
  const fees = ship + service
  const estimatedProfit = price - cogs - fees
  const marginPercent = price > 0 ? (estimatedProfit / price) * 100 : 0

  return {
    sellingPrice: price,
    cogs,
    fees,
    estimatedProfit,
    marginPercent,
  }
}

function n(v: number | null | undefined) {
  if (v == null || Number.isNaN(Number(v))) return 0
  return Number(v)
}

export function decimalStringToNumber(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'object' && v !== null && typeof (v as { toString?: () => string }).toString === 'function') {
    const s = String((v as { toString: () => string }).toString()).trim()
    if (!s || s === '[object Object]') return 0
    const x = parseFloat(s)
    return Number.isFinite(x) ? x : 0
  }
  const s = String(v).trim()
  if (!s) return 0
  const x = parseFloat(s)
  return Number.isFinite(x) ? x : 0
}

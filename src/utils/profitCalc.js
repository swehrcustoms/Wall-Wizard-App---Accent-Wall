/**
 * @param {{ cost: number, margin: number, labor_hrs: number, labor_rate: number, tax_rate: number }} opts
 * @returns {{ labor_total, subtotal_cost, client_price, profit, tax, grand_total }}
 */
export function calcPricing({ cost, margin, labor_hrs, labor_rate, tax_rate }) {
  const labor_total   = +(labor_hrs * labor_rate).toFixed(2);
  const subtotal_cost = +(cost + labor_total).toFixed(2);
  const client_price  = +(subtotal_cost / (1 - Math.max(0.001, margin))).toFixed(2);
  const profit        = +(client_price - subtotal_cost).toFixed(2);
  const tax           = +(client_price * tax_rate).toFixed(2);
  const grand_total   = +(client_price + tax).toFixed(2);
  return { labor_total, subtotal_cost, client_price, profit, tax, grand_total };
}

/**
 * Derive implied margin from a manually-entered client price.
 */
export function deriveMargin({ client_price, cost, labor_hrs, labor_rate }) {
  const subtotal = cost + labor_hrs * labor_rate;
  if (client_price <= subtotal) return 0;
  return +((1 - subtotal / client_price)).toFixed(4);
}

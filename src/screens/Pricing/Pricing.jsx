import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignStore } from '@/stores/designStore';
import { useSessionStore } from '@/stores/sessionStore';
import { calcPricing, deriveMargin } from '@/utils/profitCalc';
import Button from '@/components/Button';
import Slider from '@/components/Slider';

function PieChart({ slices }) {
  let cumPct = 0;
  const r = 40;
  const cx = 50;
  const cy = 50;
  const total = slices.reduce((s, sl) => s + sl.value, 0);

  const arcs = slices
    .filter((sl) => sl.value > 0)
    .map((sl) => {
      const pct = sl.value / total;
      const startAngle = cumPct * 2 * Math.PI - Math.PI / 2;
      cumPct += pct;
      const endAngle = cumPct * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = pct > 0.5 ? 1 : 0;
      return { ...sl, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z` };
    });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
        {arcs.map((arc) => (
          <path key={arc.label} d={arc.d} fill={arc.color} />
        ))}
      </svg>
      <div className="space-y-1.5">
        {slices.filter((s) => s.value > 0).map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="font-semibold text-gray-800">${s.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const { materials, pricing, setPricing } = useDesignStore();
  const { settings } = useSessionStore();

  const defaults = settings?.defaults ?? {};
  const tax_rate = settings?.tax_rate ?? 0.06875;

  const materialCost = materials.reduce((s, r) => s + (r.total || 0), 0);

  const [margin, setMargin] = useState(pricing.margin ?? defaults.margin ?? 0.4);
  const [laborHrs, setLaborHrs] = useState(pricing.labor_hrs ?? defaults.labor_hrs ?? 8);
  const [laborRate, setLaborRate] = useState(pricing.labor_rate ?? defaults.labor_rate ?? 50);
  const [overridePrice, setOverridePrice] = useState('');

  const calc = calcPricing({
    cost: materialCost,
    margin,
    labor_hrs: laborHrs,
    labor_rate: laborRate,
    tax_rate,
  });

  const displayPrice = overridePrice !== '' ? parseFloat(overridePrice) || 0 : calc.client_price;
  const displayProfit = overridePrice !== ''
    ? +(displayPrice - calc.subtotal_cost).toFixed(2)
    : calc.profit;
  const displayTax = +(displayPrice * tax_rate).toFixed(2);
  const displayTotal = +(displayPrice + displayTax).toFixed(2);

  useEffect(() => {
    const m = overridePrice !== ''
      ? deriveMargin({ client_price: parseFloat(overridePrice) || 0, cost: materialCost, labor_hrs: laborHrs, labor_rate: laborRate })
      : margin;

    setPricing({
      cost: materialCost,
      margin: m,
      labor_hrs: laborHrs,
      labor_rate: laborRate,
      client_price: displayPrice,
      tax: displayTax,
      profit: displayProfit,
      grand_total: displayTotal,
    });
  }, [margin, laborHrs, laborRate, overridePrice, materialCost]);

  const slices = [
    { label: 'Materials', value: materialCost, color: '#3b82f6' },
    { label: 'Labor', value: calc.labor_total, color: '#8b5cf6' },
    { label: 'Profit', value: Math.max(0, displayProfit), color: '#10b981' },
    { label: 'Tax', value: displayTax, color: '#f59e0b' },
  ];

  const rows = [
    { label: 'Material Cost', value: `$${materialCost.toFixed(2)}`, sub: true },
    { label: `Labor (${laborHrs}h × $${laborRate}/hr)`, value: `$${calc.labor_total.toFixed(2)}`, sub: true },
    { label: 'Subtotal', value: `$${calc.subtotal_cost.toFixed(2)}`, bold: true },
    { label: `Margin (${Math.round(margin * 100)}%)`, value: `+$${Math.max(0, displayProfit).toFixed(2)}`, green: true },
    { label: 'Client Price', value: `$${displayPrice.toFixed(2)}`, bold: true, large: true },
    { label: `MN Tax (${(tax_rate * 100).toFixed(3)}%)`, value: `$${displayTax.toFixed(2)}`, sub: true },
    { label: 'Grand Total', value: `$${displayTotal.toFixed(2)}`, bold: true, large: true },
  ];

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => navigate('/cuts')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="text-base font-semibold text-gray-900">Pricing Calculator</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 max-w-3xl mx-auto w-full space-y-4">

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Price Breakdown</h2>
          <PieChart slices={slices} />
        </div>

        {/* Sliders */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <h2 className="font-semibold text-gray-800 text-sm">Adjust</h2>
          <Slider
            label="Margin"
            value={Math.round(margin * 100)}
            min={30}
            max={60}
            step={1}
            onChange={(v) => { setOverridePrice(''); setMargin(v / 100); }}
            format={(v) => `${v}%`}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Labor Hours</label>
              <input
                type="number"
                min={0}
                value={laborHrs}
                onChange={(e) => setLaborHrs(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                min={0}
                value={laborRate}
                onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Override Client Price
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                min={0}
                step={1}
                placeholder={calc.client_price.toFixed(2)}
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              {overridePrice && (
                <button
                  onClick={() => setOverridePrice('')}
                  className="text-gray-400 hover:text-gray-600 text-sm min-h-[44px] px-2"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Implied margin: {Math.round(
                deriveMargin({ client_price: displayPrice, cost: materialCost, labor_hrs: laborHrs, labor_rate: laborRate }) * 100
              )}%
            </p>
          </div>
        </div>

        {/* Summary table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Summary</h2>
          <div className="space-y-2">
            {rows.map(({ label, value, sub, bold, large, green }) => (
              <div
                key={label}
                className={`flex justify-between items-center ${bold ? 'border-t border-gray-100 pt-2 mt-2' : ''}`}
              >
                <span className={`${sub ? 'text-gray-500 text-sm' : 'text-gray-700'} ${large ? 'text-base font-semibold' : ''}`}>
                  {label}
                </span>
                <span className={`font-semibold ${large ? 'text-lg text-brand-700' : ''} ${green ? 'text-green-600' : 'text-gray-900'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between gap-3">
        <Button variant="secondary" onClick={() => navigate('/cuts')}>Back</Button>
        <Button onClick={() => navigate('/quote')}>Next: Quote →</Button>
      </div>
    </div>
  );
}

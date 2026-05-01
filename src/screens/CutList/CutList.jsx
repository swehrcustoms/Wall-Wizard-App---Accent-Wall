import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { useDesignStore } from '@/stores/designStore';
import { generatePattern } from '@/utils/patternEngine';
import { piecesToMaterials } from '@/utils/materialMapper';
import { generateCutList } from '@/utils/cutOptimizer';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { showToast } from '@/components/Toast';

const SOURCES = [
  { key: 'hd', label: 'Home Depot' },
  { key: 'lowes', label: "Lowe's" },
  { key: 'menards', label: 'Menards' },
];

function CutDiagram({ cutPlan, stockLen }) {
  if (!cutPlan?.boards?.length) return null;

  return (
    <div className="space-y-1.5">
      {cutPlan.boards.slice(0, 12).map((board) => (
        <div key={board.index} className="flex items-center gap-2 text-xs">
          <span className="w-8 text-right text-gray-400 shrink-0">#{board.index}</span>
          <div className="flex-1 flex h-6 rounded overflow-hidden border border-gray-200">
            {board.cuts.map((cut, i) => {
              const pct = (cut / stockLen) * 100;
              const colors = ['bg-blue-200', 'bg-green-200', 'bg-purple-200', 'bg-amber-200', 'bg-rose-200'];
              return (
                <div
                  key={i}
                  className={`${colors[i % colors.length]} flex items-center justify-center text-[9px] font-medium border-r border-white/50`}
                  style={{ width: `${pct}%`, minWidth: 4 }}
                  title={`${cut}"`}
                >
                  {cut > 12 ? `${cut}"` : ''}
                </div>
              );
            })}
            {board.wasteLen > 0 && (
              <div
                className="bg-gray-100 flex items-center justify-center text-[9px] text-gray-400 flex-1"
                title={`Waste: ${board.wasteLen}"`}
              >
                {board.wastePct > 5 ? `${board.wastePct}%` : ''}
              </div>
            )}
          </div>
        </div>
      ))}
      {cutPlan.boards.length > 12 && (
        <p className="text-xs text-gray-400 text-center">+{cutPlan.boards.length - 12} more boards</p>
      )}
    </div>
  );
}

function DonutChart({ used, waste }) {
  const total = used + waste;
  if (!total) return null;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const usedDash = (used / total) * circ;
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="16" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="#2563eb" strokeWidth="16"
        strokeDasharray={`${usedDash} ${circ - usedDash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="butt"
      />
      <text x="50" y="54" textAnchor="middle" className="text-xs" style={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}>
        {Math.round((used / total) * 100)}%
      </text>
      <text x="50" y="66" textAnchor="middle" style={{ fontSize: 8, fill: '#9ca3af' }}>used</text>
    </svg>
  );
}

export default function CutList() {
  const navigate = useNavigate();
  const { wallDims, obstacles, pattern, materials, setMaterials, pricing, setPricing } =
    useDesignStore();

  const [source, setSource] = useState(
    materials[0]?.source ?? pricing?.source ?? 'hd'
  );
  const [rows, setRows] = useState([]);
  const [cutPlan, setCutPlan] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newRow, setNewRow] = useState({ name: '', qty: 1, length_in: 96, unit_price: 0 });
  const [editingId, setEditingId] = useState(null);

  // Recompute materials from pattern whenever source changes
  useEffect(() => {
    const pieces = generatePattern(pattern.type, wallDims, pattern.params, obstacles);
    const computed = piecesToMaterials(pattern, pieces, wallDims, source);
    setRows(computed.map((r, i) => ({ ...r, _id: i, source })));
  }, [pattern, wallDims, obstacles, source]);

  // Recompute cut plan + totals whenever rows change
  useEffect(() => {
    if (!rows.length) return;
    const stockRows = rows.filter((r) => r.length_in);
    const needed = stockRows.flatMap((r) => Array(r.qty).fill(r.length_in));
    try {
      const plan = generateCutList({ needed, stockLen: 96 });
      setCutPlan(plan);
    } catch (e) {
      console.warn('Cut plan error:', e.message);
    }

    const totalCost = rows.reduce((s, r) => s + (r.total || 0), 0);
    setPricing({ ...pricing, cost: +totalCost.toFixed(2) });
    setMaterials(rows);
  }, [rows]);

  const updateRow = (id, key, val) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._id !== id) return r;
        const updated = { ...r, [key]: key === 'name' ? val : parseFloat(val) || 0 };
        updated.total = +(updated.qty * updated.unit_price).toFixed(2);
        return updated;
      })
    );
  };

  const deleteRow = (id) => setRows((prev) => prev.filter((r) => r._id !== id));

  const addRow = () => {
    const next = {
      ...newRow,
      _id: Date.now(),
      source,
      total: +(newRow.qty * newRow.unit_price).toFixed(2),
    };
    setRows((prev) => [...prev, next]);
    setNewRow({ name: '', qty: 1, length_in: 96, unit_price: 0 });
    setAddModalOpen(false);
  };

  const exportCSV = () => {
    const csv = Papa.unparse(
      rows.map(({ name, qty, length_in, unit_price, total, source }) => ({
        Name: name,
        Qty: qty,
        'Length (in)': length_in ?? 'N/A',
        'Unit Price': `$${unit_price.toFixed(2)}`,
        Total: `$${total.toFixed(2)}`,
        Source: source,
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cut-list.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded', 'success');
  };

  const totalCost = rows.reduce((s, r) => s + (r.total || 0), 0);
  const totalBoards = rows.reduce((s, r) => s + (r.qty || 0), 0);
  const usedLen = cutPlan?.totalUsedLen ?? 0;
  const wasteLen = cutPlan?.totalWasteLen ?? 0;

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => navigate('/design')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="text-base font-semibold text-gray-900 flex-1">Material Cut List</h1>
        <button onClick={exportCSV} className="text-sm text-brand-600 font-medium px-3 py-2 rounded-lg hover:bg-brand-50 min-h-[44px]">
          CSV ↓
        </button>
        <Button size="sm" onClick={() => setAddModalOpen(true)}>+ Add Row</Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 max-w-6xl mx-auto space-y-4 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">

          {/* Table */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Controls */}
            <div className="flex items-center gap-3 p-3 border-b border-gray-100 flex-wrap">
              <div className="flex gap-1">
                {SOURCES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSource(s.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] transition-colors
                      ${source === s.key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Item Name', 'Qty', 'Length (in)', 'Unit Price', 'Total', ''].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        {editingId === row._id ? (
                          <input
                            autoFocus
                            value={row.name}
                            onChange={(e) => updateRow(row._id, 'name', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-brand-600"
                            onClick={() => setEditingId(row._id)}
                          >
                            {row.name}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={row.qty}
                          onChange={(e) => updateRow(row._id, 'qty', e.target.value)}
                          className="w-14 border rounded px-2 py-1 text-sm text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {row.length_in ? `${row.length_in}"` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">$</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.unit_price}
                            onChange={(e) => updateRow(row._id, 'unit_price', e.target.value)}
                            className="w-20 border rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800">
                        ${row.total?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => deleteRow(row._id)}
                          className="text-red-400 hover:text-red-600 p-1 min-h-[36px] min-w-[36px]"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                        No materials. Click "+ Add Row" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="border-t-2 border-gray-200">
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-3 py-2 font-semibold text-gray-700">Total</td>
                    <td className="px-3 py-2 font-bold text-gray-900">${totalCost.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Cut diagram */}
            {cutPlan?.boards?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm">Optimized Cut Diagram</h3>
                <CutDiagram cutPlan={cutPlan} stockLen={96} />
                <div className="flex gap-3 text-xs pt-1">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-300" /> Used</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Waste</span>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-4">Total Summary</h3>
              <div className="flex items-center gap-4 mb-4">
                <DonutChart used={usedLen} waste={wasteLen} />
                <div className="space-y-1 text-xs text-gray-600">
                  <p>Used: <strong>{usedLen.toFixed(1)}"</strong></p>
                  <p>Waste: <strong>{wasteLen.toFixed(1)}"</strong></p>
                  <p>Waste %: <strong>{cutPlan?.wastePct ?? 0}%</strong></p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                {[
                  ['Total Boards', totalBoards],
                  ['Total Materials', `$${totalCost.toFixed(2)}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between gap-3">
        <Button variant="secondary" onClick={() => navigate('/design')}>Back</Button>
        <Button onClick={() => navigate('/pricing')}>Next: Pricing →</Button>
      </div>

      {/* Add Row Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Custom Material"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={addRow} disabled={!newRow.name}>Add</Button>
          </>
        }
      >
        <div className="space-y-4">
          {[
            { label: 'Item Name', key: 'name', type: 'text', placeholder: 'e.g. Brad Nails' },
            { label: 'Quantity', key: 'qty', type: 'number', placeholder: '1' },
            { label: 'Length (in, optional)', key: 'length_in', type: 'number', placeholder: '96' },
            { label: 'Unit Price ($)', key: 'unit_price', type: 'number', placeholder: '0.00' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={newRow[key]}
                onChange={(e) => setNewRow((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

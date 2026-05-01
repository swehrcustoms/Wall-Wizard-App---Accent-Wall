import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useDesignStore } from '@/stores/designStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useDesigns } from '@/hooks/useDesigns';
import Button from '@/components/Button';
import { showToast } from '@/components/Toast';

function QuoteTemplate({ quoteData, ref: fwdRef }) {
  const { bizInfo, client, wallDims, patternName, date, materials, pricing, quoteTerms } = quoteData;
  const { labor_total, subtotal_cost, client_price, profit, tax, grand_total } = pricing;

  return (
    <div
      ref={fwdRef}
      id="quote-pdf-template"
      style={{ fontFamily: 'sans-serif', width: 800, padding: 48, background: '#fff', color: '#111' }}
    >
      {/* Letterhead */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, borderBottom: '2px solid #0284c7', paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0284c7' }}>🪄 {bizInfo.name || 'WallWizard'}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{bizInfo.address}</div>
          <div style={{ fontSize: 12, color: '#555' }}>{bizInfo.phone} · {bizInfo.email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#374151' }}>Quote</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{date}</div>
        </div>
      </div>

      {/* Client + Job */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Client</div>
          <div style={{ fontWeight: 600 }}>{client.name || '—'}</div>
          <div style={{ fontSize: 12, color: '#555' }}>{client.email}</div>
          <div style={{ fontSize: 12, color: '#555' }}>{client.address}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Job Details</div>
          <div style={{ fontSize: 12 }}>Pattern: <strong>{patternName}</strong></div>
          <div style={{ fontSize: 12 }}>Wall: {Math.floor(wallDims.width_in / 12)}′ {wallDims.width_in % 12}″ × {Math.floor(wallDims.height_in / 12)}′ {wallDims.height_in % 12}″</div>
        </div>
      </div>

      {/* Materials table */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Material List</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              {['Item', 'Qty', 'Unit Price', 'Total'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materials.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '5px 8px' }}>{m.name}</td>
                <td style={{ padding: '5px 8px' }}>{m.qty}</td>
                <td style={{ padding: '5px 8px' }}>${m.unit_price?.toFixed(2)}</td>
                <td style={{ padding: '5px 8px', fontWeight: 500 }}>${m.total?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pricing */}
      <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Price Summary</div>
        {[
          ['Materials', `$${(pricing.cost || 0).toFixed(2)}`],
          ['Labor', `$${labor_total?.toFixed(2)}`],
          ['Subtotal', `$${subtotal_cost?.toFixed(2)}`],
          ['Profit / Markup', `$${profit?.toFixed(2)}`],
          ['Client Price', `$${client_price?.toFixed(2)}`],
          [`Tax (${((pricing.tax_rate ?? 0.06875) * 100).toFixed(3)}%)`, `$${tax?.toFixed(2)}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: '#555' }}>{k}</span>
            <span>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, borderTop: '2px solid #d1d5db', marginTop: 8, paddingTop: 8 }}>
          <span>Grand Total</span>
          <span style={{ color: '#0284c7' }}>${grand_total?.toFixed(2)}</span>
        </div>
      </div>

      {/* Terms */}
      {quoteTerms && (
        <div style={{ fontSize: 11, color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Terms & Conditions</div>
          <div>{quoteTerms}</div>
        </div>
      )}

      {/* Signature */}
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {['Client Signature', 'Date'].map((label) => (
          <div key={label}>
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: 8, fontSize: 11, color: '#6b7280' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Quote() {
  const navigate = useNavigate();
  const { id, name, wallDims, pattern, materials, pricing, client, setClient, setName } =
    useDesignStore();
  const { settings } = useSessionStore();
  const { save } = useDesigns();

  const templateRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notes, setNotes] = useState('');

  const bizInfo = settings?.business_info ?? {};
  const quoteTerms = settings?.quote_terms ?? '';

  const quoteData = {
    bizInfo,
    client: client ?? { name: '', email: '', address: '' },
    wallDims,
    patternName: pattern?.type?.replace(/-/g, ' ') ?? '',
    date: new Date().toLocaleDateString(),
    materials,
    pricing,
    quoteTerms,
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const el = templateRef.current;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height / canvas.width) * w;
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save(`WallWizard-Quote-${client?.name || 'Quote'}.pdf`);
      showToast('PDF downloaded!', 'success');
    } catch (e) {
      showToast('PDF export failed', 'error');
    }
    setDownloading(false);
  };

  const handleEmailQuote = async () => {
    await handleDownloadPDF();
    const subject = encodeURIComponent(`Accent Wall Quote — ${pattern?.type?.replace(/-/g, ' ')}`);
    const body = encodeURIComponent(`Hi ${client?.name || ''},\n\nPlease find your accent wall quote attached.\n\nTotal: $${pricing?.grand_total?.toFixed(2) ?? '0.00'}\n\nBest,\n${bizInfo.name || 'WallWizard'}`);
    window.location.href = `mailto:${client?.email ?? ''}?subject=${subject}&body=${body}`;
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await save({
      id,
      name,
      type: 'job',
      status: 'quoted',
      wall_dims: wallDims,
      obstacles: [],
      pattern,
      materials,
      pricing,
      client,
    });
    setSaving(false);
    if (!error) {
      showToast('Quote saved!', 'success');
      navigate('/');
    } else {
      showToast('Save failed', 'error');
    }
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => navigate('/pricing')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="text-base font-semibold text-gray-900 flex-1">Quote & Export</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 max-w-3xl mx-auto w-full space-y-4">
        {/* Client fields */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">Client Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Job Name', key: 'name', value: name, onChange: (v) => setName(v) },
              { label: 'Client Name', key: 'client.name', value: client?.name ?? '', onChange: (v) => setClient({ ...client, name: v }) },
              { label: 'Client Email', key: 'client.email', value: client?.email ?? '', onChange: (v) => setClient({ ...client, email: v }) },
              { label: 'Job Address', key: 'client.address', value: client?.address ?? '', onChange: (v) => setClient({ ...client, address: v }) },
            ].map(({ label, key, value, onChange }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Any special notes for this quote…"
            />
          </div>
        </div>

        {/* Quote preview */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 text-sm">Quote Preview</h2>
            <span className="text-xs text-gray-400">Scroll to see full PDF</span>
          </div>
          <div className="overflow-auto max-h-96 p-2 bg-gray-100">
            <div className="min-w-[640px] origin-top scale-75 md:scale-100">
              <QuoteTemplate quoteData={quoteData} ref={templateRef} />
            </div>
          </div>
        </div>

        {/* Hidden full-size for PDF capture */}
        <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none" aria-hidden>
          <QuoteTemplate quoteData={quoteData} ref={templateRef} />
        </div>
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex flex-wrap gap-2 justify-end">
        <Button variant="secondary" onClick={() => navigate('/pricing')}>Back</Button>
        <Button variant="secondary" onClick={handleEmailQuote} disabled={downloading}>
          📧 Email Quote
        </Button>
        <Button variant="secondary" onClick={handleDownloadPDF} disabled={downloading}>
          {downloading ? 'Generating…' : '⬇ Download PDF'}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : '✓ Save & Close'}
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import Button from '@/components/Button';
import Slider from '@/components/Slider';
import { showToast } from '@/components/Toast';

export default function Settings() {
  const { user, settings, updateSettings, signOut } = useSessionStore();
  const [bizInfo, setBizInfo] = useState(settings.business_info ?? {});
  const [defaults, setDefaults] = useState(settings.defaults ?? {});
  const [taxRate, setTaxRate] = useState(settings.tax_rate ?? 0.06875);
  const [quoteTerms, setQuoteTerms] = useState(settings.quote_terms ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({ business_info: bizInfo, defaults, tax_rate: taxRate, quote_terms: quoteTerms });
    setSaving(false);
    showToast('Settings saved', 'success');
  };

  const updateBiz = (key, val) => setBizInfo((b) => ({ ...b, [key]: val }));
  const updateDefaults = (key, val) => setDefaults((d) => ({ ...d, [key]: val }));

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-20">
        <h1 className="text-base font-semibold text-gray-900">Settings</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-5">

        {/* Business Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Business Info</h2>
          {[
            { label: 'Business Name', key: 'name', placeholder: 'Your business name' },
            { label: 'Address', key: 'address', placeholder: '123 Main St, City, MN' },
            { label: 'Phone', key: 'phone', placeholder: '(612) 555-0100' },
            { label: 'Email', key: 'email', placeholder: 'you@yourco.com' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={bizInfo[key] ?? ''}
                placeholder={placeholder}
                onChange={(e) => updateBiz(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ))}
        </div>

        {/* Defaults */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <h2 className="font-semibold text-gray-800">Job Defaults</h2>
          <Slider
            label="Default Margin"
            value={Math.round((defaults.margin ?? 0.4) * 100)}
            min={30}
            max={60}
            step={1}
            onChange={(v) => updateDefaults('margin', v / 100)}
            format={(v) => `${v}%`}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Labor Hours</label>
              <input
                type="number"
                min={1}
                value={defaults.labor_hrs ?? 8}
                onChange={(e) => updateDefaults('labor_hrs', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                min={1}
                value={defaults.labor_rate ?? 50}
                onChange={(e) => updateDefaults('labor_rate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Supplier</label>
            <div className="flex gap-2">
              {[{ key: 'hd', label: 'Home Depot' }, { key: 'lowes', label: "Lowe's" }, { key: 'menards', label: 'Menards' }].map((s) => (
                <button
                  key={s.key}
                  onClick={() => updateDefaults('supplier', s.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors
                    ${defaults.supplier === s.key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tax */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Tax Rate</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State Tax Rate (%)</label>
            <input
              type="number"
              min={0}
              max={20}
              step={0.001}
              value={(taxRate * 100).toFixed(3)}
              onChange={(e) => setTaxRate((parseFloat(e.target.value) || 0) / 100)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">MN default: 6.875%</p>
          </div>
        </div>

        {/* Quote terms */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Quote Terms</h2>
          <textarea
            rows={5}
            value={quoteTerms}
            onChange={(e) => setQuoteTerms(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
          />
        </div>

        {/* Account */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Account</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <button
            onClick={signOut}
            className="text-sm text-red-600 hover:text-red-700 font-medium min-h-[44px]"
          >
            Sign out
          </button>
        </div>

        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Slider({ label, value, min, max, step = 1, onChange, format }) {
  const display = format ? format(value) : value;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-brand-600 font-semibold">{display}</span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, #0284c7 ${pct}%, #e5e7eb ${pct}%)`,
          }}
        />
      </div>
    </div>
  );
}

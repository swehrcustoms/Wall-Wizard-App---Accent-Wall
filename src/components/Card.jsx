export default function Card({ children, className = '', onClick, ...props }) {
  const base =
    'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden';
  const interactive = onClick
    ? 'cursor-pointer hover:shadow-md hover:border-brand-300 transition-all active:scale-[0.98]'
    : '';
  return (
    <div
      className={`${base} ${interactive} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

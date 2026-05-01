import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function SideNav() {
  return (
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 h-full shrink-0">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪄</span>
          <span className="font-bold text-lg text-brand-700">WallWizard</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]
              ${isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

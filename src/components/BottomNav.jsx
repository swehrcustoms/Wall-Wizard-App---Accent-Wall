import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Jobs', icon: '🏠' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex">
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors min-h-[56px]
            ${isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'}`
          }
        >
          <span className="text-xl mb-0.5">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

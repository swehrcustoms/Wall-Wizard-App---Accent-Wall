import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import BottomNav from './BottomNav';
import { ToastProvider } from './Toast';

export default function AppShell() {
  return (
    <div className="flex h-[100svh] overflow-hidden bg-gray-50">
      <SideNav />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
      <ToastProvider />
    </div>
  );
}

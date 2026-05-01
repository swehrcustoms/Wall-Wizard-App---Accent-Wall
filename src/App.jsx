import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import AppShell from '@/components/AppShell';
import { AuthGuard, GuestGuard } from '@/components/RouteGuard';

import Login from '@/screens/Login/Login';
import Dashboard from '@/screens/Dashboard/Dashboard';
import WallSetup from '@/screens/WallSetup/WallSetup';
import PatternDesigner from '@/screens/PatternDesigner/PatternDesigner';
import CutList from '@/screens/CutList/CutList';
import Pricing from '@/screens/Pricing/Pricing';
import Quote from '@/screens/Quote/Quote';
import Settings from '@/screens/Settings/Settings';

function AppRoutes() {
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestGuard>
            <Login />
          </GuestGuard>
        }
      />
      <Route
        element={
          <AuthGuard>
            <AppShell />
          </AuthGuard>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/setup" element={<WallSetup />} />
        <Route path="/design" element={<PatternDesigner />} />
        <Route path="/cuts" element={<CutList />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/quote" element={<Quote />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

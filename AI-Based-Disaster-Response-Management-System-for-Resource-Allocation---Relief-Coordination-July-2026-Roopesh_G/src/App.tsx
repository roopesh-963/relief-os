/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotificationManager } from './components/NotificationManager';
import { NotificationProvider } from './hooks/useNotifications';
import { ThemeProvider } from './hooks/useTheme';
import { AppNavBar } from './components/navigation/AppNavBar';

const Landing = lazy(() => import('./pages/Landing'));
const CrisisMap = lazy(() => import('./pages/CrisisMap'));
const Resources = lazy(() => import('./pages/Resources'));
const SOSApp = lazy(() => import('./pages/SOSApp'));
const Analytics = lazy(() => import('./pages/Analytics'));
const SupplyChain = lazy(() => import('./pages/SupplyChain'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const GlobalCrisisDashboard = lazy(() => import('./pages/GlobalCrisisDashboard'));
const DisasterOperationsDashboard = lazy(() => import('./pages/DisasterOperationsDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const OperationsCopilot = lazy(() => import('./components/assistant/OperationsCopilot'));

function RouteLoader() {
  return <div className="min-h-screen bg-black" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <NotificationProvider>
        <main className="min-h-screen bg-[var(--dm-bg)] text-[var(--dm-text)] transition-colors duration-500">
          <NotificationManager />

          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/landing" element={<Landing />} />

              <Route path="/dashboard" element={<ProtectedRoute><DisasterOperationsDashboard /></ProtectedRoute>} />
              <Route path="/operations-dashboard" element={<ProtectedRoute><DisasterOperationsDashboard /></ProtectedRoute>} />
              <Route path="/logistics-planning" element={<ProtectedRoute><DisasterOperationsDashboard /></ProtectedRoute>} />
              <Route path="/milestone3" element={<ProtectedRoute><DisasterOperationsDashboard /></ProtectedRoute>} />
              <Route path="/global-crisis" element={<ProtectedRoute><GlobalCrisisDashboard /></ProtectedRoute>} />
              <Route path="/crisis-map" element={<ProtectedRoute><CrisisMap /></ProtectedRoute>} />
              <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
              <Route path="/sos-citizen" element={<ProtectedRoute><SOSApp /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/supply-chain" element={<ProtectedRoute><SupplyChain /></ProtectedRoute>} />
              <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

              <Route path="/operations" element={<Navigate to="/operations-dashboard" replace />} />
              <Route path="/map" element={<Navigate to="/crisis-map" replace />} />
              <Route path="/sos" element={<Navigate to="/sos-citizen" replace />} />
              <Route path="/supply" element={<Navigate to="/supply-chain" replace />} />
              <Route path="/assistant" element={<Navigate to="/ai-assistant" replace />} />
              <Route path="/global" element={<Navigate to="/global-crisis" replace />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

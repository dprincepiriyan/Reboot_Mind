import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getServerUrl } from './config/server';
import { Navbar } from './components/Navbar';
import { ConnectionBanner } from './components/ConnectionBanner';
import { initBackButton } from './lib/backButton';
import { initNotificationChannels, requestNotificationPermission } from './lib/notifications';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Questionnaire } from './pages/Questionnaire';
import { ChatroomList } from './pages/ChatroomList';
import { Chatroom } from './pages/Chatroom';
import { SobrietyDashboard } from './pages/SobrietyDashboard';
import { DailyTasks } from './pages/DailyTasks';
import { Journal } from './pages/Journal';
import { Resources } from './pages/Resources';
import { NeuroReset } from './pages/NeuroReset';
import { Connect } from './pages/Connect';
import { authApi, Profile } from './api/auth';
import { authStorage, AUTH_CHANGED_EVENT } from './lib/authStorage';
import { useServerUrl } from './hooks/useServerUrl';

import { SocketProvider } from './contexts/SocketContext';

const MobileLifecycleManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initNotificationChannels();
    requestNotificationPermission();

    initBackButton(
      () => navigate(-1),
      () => {
        const rootPaths = ['/login', '/signup', '/chatrooms', '/connect'];
        return rootPaths.includes(location.pathname);
      }
    );
  }, [navigate, location.pathname]);

  return <ConnectionBanner />;
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [isLoading, setIsLoading] = useState(true);
  const serverUrl = useServerUrl();
  const serverConfigured = serverUrl !== null;

  const fetchUser = useCallback(async () => {
    const t = authStorage.getToken();
    setToken(t);
    if (!t || getServerUrl() === null) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const user = await authApi.getMe();
      setCurrentUser(user);
    } catch {
      // Don't auto logout on any error (only logout on 401, which the client.ts already does by removing the token)
      const isTokenRemoved = !authStorage.getToken();
      if (isTokenRemoved) {
         setCurrentUser(null);
         setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch the profile on startup and whenever the server address changes.
  useEffect(() => {
    fetchUser();
  }, [fetchUser, serverUrl]);

  // Session ended elsewhere (401 in apiFetch, logout): reset state; routes redirect to /login.
  useEffect(() => {
    const onAuthChanged = () => {
      const t = authStorage.getToken();
      setToken(t);
      if (!t) setCurrentUser(null);
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, []);

  const handleLogout = () => {
    authStorage.clearToken();
    setToken(null);
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400 text-sm">
        Loading RebootMind...
      </div>
    );
  }

  return (
    <SocketProvider token={token}>
      <BrowserRouter>
        <MobileLifecycleManager />
        <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans pt-safe pb-safe">
          <Navbar user={currentUser} onLogout={handleLogout} onProfileUpdate={fetchUser} />

          <main className="flex-1">
            {!serverConfigured ? (
              <Routes>
                <Route path="/connect" element={<Connect />} />
                <Route path="*" element={<Navigate to="/connect" replace />} />
              </Routes>
            ) : (
            <Routes>
              <Route path="/connect" element={<Connect />} />
              <Route
                path="/login"
                element={!token ? <Login onLoginSuccess={fetchUser} /> : <Navigate to="/chatrooms" />}
              />
              <Route
                path="/signup"
                element={!token ? <Signup onSignupSuccess={fetchUser} /> : <Navigate to="/questionnaire" />}
              />
              <Route
                path="/questionnaire"
                element={token ? <Questionnaire /> : <Navigate to="/login" />}
              />
              <Route
                path="/chatrooms"
                element={token ? <ChatroomList /> : <Navigate to="/login" />}
              />
              <Route
                path="/chatroom/:id"
                element={token ? <Chatroom /> : <Navigate to="/login" />}
              />
              <Route
                path="/sobriety"
                element={token ? <SobrietyDashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/tasks"
                element={token ? <DailyTasks /> : <Navigate to="/login" />}
              />
              <Route
                path="/journal"
                element={token ? <Journal /> : <Navigate to="/login" />}
              />
              <Route
                path="/resources"
                element={token ? <Resources /> : <Navigate to="/login" />}
              />
              <Route
                path="/neuro-reset"
                element={token ? <NeuroReset /> : <Navigate to="/login" />}
              />
              <Route
                path="*"
                element={<Navigate to={token ? "/chatrooms" : "/login"} replace />}
              />
            </Routes>
            )}
          </main>
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
};

export default App;

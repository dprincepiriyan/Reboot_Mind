import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Questionnaire } from './pages/Questionnaire';
import { ChatroomList } from './pages/ChatroomList';
import { Chatroom } from './pages/Chatroom';
import { SobrietyDashboard } from './pages/SobrietyDashboard';
import { DailyTasks } from './pages/DailyTasks';
import { authApi, Profile } from './api/auth';

import { SocketProvider } from './contexts/SocketContext';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('mad_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    const t = localStorage.getItem('mad_token');
    setToken(t);
    if (!t) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const user = await authApi.getMe();
      setCurrentUser(user);
    } catch {
      // Don't auto logout on any error (only logout on 401, which the client.ts already does by removing the token)
      const isTokenRemoved = !localStorage.getItem('mad_token');
      if (isTokenRemoved) {
         setCurrentUser(null);
         setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mad_token');
    setToken(null);
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400 text-sm">
        Loading MAD Application...
      </div>
    );
  }

  return (
    <SocketProvider token={token}>
      <BrowserRouter>
        <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans">
          <Navbar user={currentUser} onLogout={handleLogout} />

          <main className="flex-1">
            <Routes>
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
                path="*"
                element={<Navigate to={token ? "/chatrooms" : "/login"} replace />}
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
};

export default App;

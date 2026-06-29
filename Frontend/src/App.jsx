import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AnimatedBackground from './components/AnimatedBackground';
import LoginPage from './pages/LoginPage';
import GroupsPage from './pages/GroupsPage';
import ChatPage from './pages/ChatPage';

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-dvh relative">
      <AnimatedBackground />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/chat/:groupId" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

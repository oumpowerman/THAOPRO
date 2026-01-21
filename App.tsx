
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MemberDashboard from './pages/MemberDashboard';
import CircleManagement from './pages/CircleManagement';
import BiddingSystem from './pages/BiddingSystem';
import CollectionTracker from './pages/CollectionTracker';
import PayoutManagement from './pages/PayoutManagement'; 
import MemberProfile from './pages/MemberProfile';
import MemberLiveAuction from './pages/MemberLiveAuction';
import ScriptSettings from './pages/ScriptSettings'; 
import SystemAdminDashboard from './pages/SystemAdminDashboard';
import Login from './pages/Login';
import { AppProvider, useAppContext } from './context/AppContext';
import { GlobalDialog } from './components/GlobalDialog';

// Component to protect routes that require login
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user } = useAppContext();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Component to decide which dashboard to show based on role
const RoleBasedDashboard = () => {
    const { user } = useAppContext();
    if (user?.role === 'SYSTEM_ADMIN') {
        return <SystemAdminDashboard />;
    }
    if (user?.role === 'ADMIN') {
        return <Dashboard />;
    }
    return <MemberDashboard />;
};

const App = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><RoleBasedDashboard /></ProtectedRoute>} />
          
          {/* Admin specific routes */}
          <Route path="/circles" element={<ProtectedRoute><CircleManagement /></ProtectedRoute>} />
          <Route path="/bidding" element={<ProtectedRoute><BiddingSystem /></ProtectedRoute>} />
          <Route path="/collection" element={<ProtectedRoute><CollectionTracker /></ProtectedRoute>} />
          <Route path="/payouts" element={<ProtectedRoute><PayoutManagement /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
          <Route path="/scripts" element={<ProtectedRoute><ScriptSettings /></ProtectedRoute>} />
          
          {/* Member routes */}
          <Route path="/my-circles" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
          <Route path="/live-auction" element={<ProtectedRoute><MemberLiveAuction /></ProtectedRoute>} />
        </Routes>
        
        {/* Global Components */}
        <GlobalDialog />
      </Router>
    </AppProvider>
  );
};

export default App;

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, ActivitySquare, BarChart2, User, Activity } from 'lucide-react';
import Home from './pages/Home';
import Auth from './pages/Auth';
import MedicalHistory from './pages/MedicalHistory';
import Questionnaire from './pages/Questionnaire';
import HardwarePage from './pages/HardwarePage';
import CameraPPG from './pages/CameraPPG';
import AnalyzingPage from './pages/AnalyzingPage';
import Results from './pages/Results';
import DoctorDashboard from './pages/DoctorDashboard';
import Profile from './pages/Profile';
import TrendsPage from './pages/TrendsPage';
import NearbyDoctors from './pages/NearbyDoctors';

import { useAuth } from './context/AuthContext';

function BottomNav() {
  const location = useLocation();
  const items = [
    { label: 'Home', icon: HomeIcon, route: '/' },
    { label: 'New Scan', icon: ActivitySquare, route: '/scan/medical-history' },
    { label: 'Reports', icon: BarChart2, route: '/trends' },
    { label: 'Profile', icon: User, route: '/profile' },
  ];
  // Hide bottom nav on scan flow pages
  const hiddenPaths = ['/scan/', '/analyzing', '/results'];
  const shouldHide = hiddenPaths.some(p => location.pathname.includes(p));
  if (shouldHide) return null;

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <Link
          key={item.route}
          to={item.route}
          className={`bottom-nav-item ${location.pathname === item.route ? 'active' : ''}`}
        >
          <item.icon size={22} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function App() {
  const { user } = useAuth();
  
  return (
    <Router>
      <div className="min-h-screen flex flex-col" style={{ background: '#F4F7FB' }}>
        <header className="bg-white border-b sticky top-0 z-50" style={{ borderColor: '#E2E8F0' }}>
          <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#064E3B' }}>
                <Activity className="text-white" size={18} />
              </div>
              <span className="font-bold text-lg" style={{ color: '#0F172A' }}>
                NIDAN<span style={{ color: '#64748B' }}>-AI</span>
              </span>
            </Link>
            {user ? (
              <Link to="/profile">
                <img 
                  src={user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                />
              </Link>
            ) : (
              <Link to="/auth" className="text-sm font-medium" style={{ color: '#64748B' }}>Login</Link>
            )}
          </div>
        </header>

        <main className="flex-1 max-w-lg w-full mx-auto px-5 py-5 pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/scan/medical-history" element={<MedicalHistory />} />
            <Route path="/scan/questionnaire" element={<Questionnaire />} />
            <Route path="/scan/hardware" element={<HardwarePage />} />
            <Route path="/scan/ppg" element={<CameraPPG />} />
            <Route path="/analyzing" element={<AnalyzingPage />} />
            <Route path="/results" element={<Results />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/trends" element={<TrendsPage />} />
            <Route path="/nearby-doctors" element={<NearbyDoctors />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </Router>
  );
}

export default App;

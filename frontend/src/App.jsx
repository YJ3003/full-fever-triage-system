import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Questionnaire from './pages/Questionnaire';
import SensorPage from './pages/SensorPage';
import CameraPPG from './pages/CameraPPG';
import Results from './pages/Results';
import DoctorDashboard from './pages/DoctorDashboard';
import { Activity } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-medical-teal rounded-lg flex items-center justify-center">
                <Activity className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-medical-dark tracking-tight">NIDAN<span className="text-medical-teal">-AI</span></span>
            </Link>
            <div className="flex gap-4">
              <Link to="/auth" className="text-sm font-medium text-gray-500 hover:text-medical-teal">Login</Link>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-md w-full mx-auto p-4 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/sensor" element={<SensorPage />} />
            <Route path="/camera-ppg" element={<CameraPPG />} />
            <Route path="/results" element={<Results />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

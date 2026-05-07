import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <Activity className="text-white w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to NIDAN-AI</h1>
      <p className="text-gray-500 text-center mb-8">Your intelligent first-level health assistant.</p>

      <div className="w-full max-w-sm card">
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('/'); }}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" required className="input-field" placeholder="John Doe" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required className="input-field" placeholder="••••••••" />
          </div>

          <button type="submit" className="btn-primary w-full mt-6">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

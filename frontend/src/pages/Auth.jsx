import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Auth() {
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/');
  }, [user, loading]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in error:', err);
      alert('Sign in failed. Check Supabase config.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '85vh', paddingBottom: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xs text-center"
      >
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg"
          style={{ background: '#064E3B' }}>
          <Activity size={36} color="white" />
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: '#0F172A' }}>Welcome to NIDAN-AI</h1>
        <p className="text-sm mb-10" style={{ color: '#64748B' }}>
          Sign in to track your health, access your scan history, and get personalised AI insights.
        </p>

        {/* Google Sign In */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white border rounded-2xl py-4 px-6 font-semibold text-sm shadow-sm"
          style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
        >
          {/* Google SVG icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </motion.button>

        <p className="text-xs mt-8 leading-relaxed" style={{ color: '#94A3B8' }}>
          By continuing, you agree to NIDAN-AI's terms of service. Your health data is encrypted and never shared.
        </p>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { User, LogOut, ChevronRight, Activity, Shield, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#E2E8F0', borderTopColor: '#064E3B' }} />
    </div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: '60vh' }}>
        <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center" style={{ background: '#F1F5F9' }}>
          <User size={28} color="#94A3B8" />
        </div>
        <h2 className="font-bold mb-2" style={{ color: '#0F172A' }}>Not signed in</h2>
        <p className="text-sm mb-6" style={{ color: '#64748B' }}>Sign in to access your profile and health history</p>
        <button onClick={() => navigate('/auth')} className="btn-primary" style={{ maxWidth: 200 }}>Sign In</button>
      </div>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const email = user.email;

  return (
    <div className="space-y-5 pb-8">
      <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Profile</h1>

      {/* User Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card text-center py-8">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4" style={{ borderColor: '#ECFDF5' }} />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white" style={{ background: '#064E3B' }}>
            {fullName[0].toUpperCase()}
          </div>
        )}
        <h2 className="text-lg font-bold mb-1" style={{ color: '#0F172A' }}>{fullName}</h2>
        <p className="text-sm" style={{ color: '#64748B' }}>{email}</p>
        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#ECFDF5', color: '#064E3B' }}>
          <Shield size={12} /> Verified via Google
        </div>
      </motion.div>

      {/* Quick Links */}
      <div className="card space-y-1 p-3">
        {[
          { label: 'View Health Trends', icon: Activity, route: '/trends' },
          { label: 'Scan History', icon: Clock, route: '/trends' },
        ].map((item, i) => (
          <button key={i} onClick={() => navigate(item.route)}
            className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <item.icon size={18} color="#064E3B" />
              <span className="text-sm font-medium" style={{ color: '#0F172A' }}>{item.label}</span>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </button>
        ))}
      </div>

      {/* Sign Out */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border font-semibold text-sm"
        style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FEF2F2' }}
      >
        <LogOut size={18} /> Sign Out
      </motion.button>
    </div>
  );
}

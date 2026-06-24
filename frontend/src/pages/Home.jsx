import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Thermometer, Droplets, Heart, Shield, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, getScans } = useAuth();
  const [latestScan, setLatestScan] = useState(null);

  useEffect(() => {
    if (user) {
      getScans(1).then(scans => {
        if (scans && scans.length > 0) {
          setLatestScan(scans[0]);
        }
      });
    }
  }, [user, getScans]);

  const getGreeting = () => {
    const h = new Date().getHours();
    let greeting = 'Good evening';
    if (h < 12) greeting = 'Good morning';
    else if (h < 17) greeting = 'Good afternoon';
    
    const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0];
    return name ? `${greeting}, ${name}` : greeting;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>{getGreeting()}</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>Here is your health summary</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Temperature', value: latestScan?.temperature_c ? Number(latestScan.temperature_c).toFixed(1) : '—', unit: '°C', icon: Thermometer, color: '#064E3B' },
          { label: 'SpO2', value: latestScan?.spo2 || '—', unit: '%', icon: Droplets, color: '#0EA5E9' },
          { label: 'Heart Rate', value: latestScan?.heart_rate || '—', unit: 'bpm', icon: Heart, color: '#D97706' },
          { label: 'Risk Level', value: latestScan?.risk_level || '—', unit: '', icon: Shield, color: '#16A34A' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card flex flex-col gap-3"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${item.color}12` }}>
              <item.icon size={18} color={item.color} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#64748B' }}>{item.label}</p>
              <p className="text-xl font-bold" style={{ color: '#0F172A' }}>
                {item.value} <span className="text-xs font-normal" style={{ color: '#94A3B8' }}>{item.unit}</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Start New Scan CTA */}
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => navigate('/scan/medical-history')}
        className="btn-primary text-base"
      >
        <Plus size={20} /> Start New Health Scan
      </motion.button>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="card"
        style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#064E3B' }}>
            <Activity size={20} color="white" />
          </div>
          <div>
            <h3 className="font-bold mb-1" style={{ color: '#064E3B' }}>NIDAN-AI Triage</h3>
            <p className="text-sm" style={{ color: '#047857' }}>
              Complete a health scan to get AI-powered risk assessment, infection pattern analysis, and personalized health recommendations.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="font-bold" style={{ color: '#0F172A' }}>Quick Actions</h3>
        {[
          { title: 'New Triage Assessment', desc: 'Log symptoms and get AI analysis', route: '/scan/medical-history' },
          { title: 'View Health Trends', desc: 'Track your recovery over time', route: '/trends' },
        ].map((action, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            onClick={() => navigate(action.route)}
            className="w-full card flex items-center justify-between hover:shadow-md group"
            style={{ cursor: 'pointer' }}
          >
            <div className="text-left">
              <h4 className="font-semibold text-sm" style={{ color: '#0F172A' }}>{action.title}</h4>
              <p className="text-xs" style={{ color: '#94A3B8' }}>{action.desc}</p>
            </div>
            <ArrowRight size={18} color="#94A3B8" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

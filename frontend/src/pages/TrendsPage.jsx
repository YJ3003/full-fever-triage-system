import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Thermometer, Droplets, Heart, Activity, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl p-3 shadow-lg border" style={{ borderColor: '#E2E8F0' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const RISK_COLOR = { Low: '#16A34A', Moderate: '#D97706', High: '#EA580C', Critical: '#DC2626' };

export default function TrendsPage() {
  const { user, getScans } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('temp');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (user) {
        const data = await getScans(20);
        // Sort ascending for chart
        const sorted = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setScans(sorted);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const analyzeFeverCurve = (allScans) => {
    const validScans = allScans.filter(s => s.temperature_c).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (validScans.length < 3) return { type: 'Insufficient Data', desc: 'Need at least 3 scans to determine pattern.', color: '#94A3B8' };
    const recent = validScans.slice(-7);
    if (recent.length < 3) return { type: 'Insufficient Data', desc: 'Need at least 3 recent temperature readings.', color: '#94A3B8' };
    let isIncreasing = true;
    let isSustainedHigh = true;
    let peaksAndValleys = 0;
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i-1].temperature_c;
      const curr = recent[i].temperature_c;
      if (curr < prev) isIncreasing = false;
      if (curr < 37.5) isSustainedHigh = false;
      if (i > 1) {
        const prevPrev = recent[i-2].temperature_c;
        if ((prev > prevPrev && prev > curr) || (prev < prevPrev && prev < curr)) peaksAndValleys++;
      }
    }
    if (isSustainedHigh && recent.every(s => s.temperature_c >= 38.0)) return { type: 'Sustained High (Possible Dengue/Severe Viral)', desc: 'Consistently high fever. Strongly correlates with Dengue or severe systemic viral infections. Requires immediate medical attention.', color: '#DC2626' };
    if (isIncreasing && recent[recent.length - 1].temperature_c > 37.5) return { type: 'Step-ladder (Possible Typhoid/Enteric)', desc: 'Progressively increasing temperature over days. Often associated with Enteric (Typhoid) fever. Blood cultures or Widal tests may be recommended.', color: '#EA580C' };
    if (peaksAndValleys >= 1 && recent.some(s => s.temperature_c >= 38.0)) return { type: 'Cyclical / Intermittent (Possible Malaria)', desc: 'Fever spiking and dropping sharply. This paroxysmal pattern is highly characteristic of Malaria or certain bacterial infections. Blood smear tests recommended.', color: '#D97706' };
    return { type: 'Irregular / Fluctuating', desc: 'No clear definitive geometric pattern detected. Often indicates a standard viral infection or resolving illness. Continue monitoring.', color: '#16A34A' };
  };
  const curveAnalysis = analyzeFeverCurve(scans);

  // Prepare chart data
  const chartData = scans.map((s, i) => ({
    label: new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    temp: s.temperature_c ?? null,
    spo2: s.spo2 ?? null,
    hr: s.heart_rate ?? null,
    burden: s.symptom_burden ?? null,
    risk: s.risk_level,
    idx: i,
  }));

  const tabs = [
    { id: 'temp', label: 'Temperature', color: '#EA580C', dataKey: 'temp', unit: '°C', icon: Thermometer },
    { id: 'spo2', label: 'SpO2', color: '#0EA5E9', dataKey: 'spo2', unit: '%', icon: Droplets },
    { id: 'hr', label: 'Heart Rate', color: '#DC2626', dataKey: 'hr', unit: 'bpm', icon: Heart },
    { id: 'burden', label: 'Symptom Burden', color: '#7C3AED', dataKey: 'burden', unit: '', icon: Activity },
  ];
  const activeTabData = tabs.find(t => t.id === activeTab);

  // Stats for current period
  const values = chartData.map(d => d[activeTab]).filter(v => v !== null);
  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';
  const max = values.length ? Math.max(...values).toFixed(1) : '—';
  const min = values.length ? Math.min(...values).toFixed(1) : '—';

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2.5 bg-white rounded-xl shadow-sm border" style={{ borderColor: '#E2E8F0' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Health Trends</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Your daily health report analysis</p>
        </div>
      </div>

      {!user ? (
        <div className="card text-center py-10">
          <TrendingUp size={40} color="#94A3B8" className="mx-auto mb-3" />
          <h3 className="font-bold mb-2" style={{ color: '#0F172A' }}>Sign in to view trends</h3>
          <p className="text-sm mb-5" style={{ color: '#64748B' }}>Your health trends are saved with your account</p>
          <button onClick={() => navigate('/auth')} className="btn-primary" style={{ maxWidth: 180, margin: '0 auto' }}>Sign In</button>
        </div>
      ) : loading ? (
        <div className="card flex justify-center items-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#E2E8F0', borderTopColor: '#064E3B' }} />
        </div>
      ) : scans.length === 0 ? (
        <div className="card text-center py-10">
          <Activity size={40} color="#94A3B8" className="mx-auto mb-3" />
          <h3 className="font-bold mb-2" style={{ color: '#0F172A' }}>No scans yet</h3>
          <p className="text-sm mb-5" style={{ color: '#64748B' }}>Complete your first health scan to start tracking trends</p>
          <button onClick={() => navigate('/scan/medical-history')} className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }}>Start First Scan</button>
        </div>
      ) : (
        <>
          {/* Metric Tab Switcher */}
          <div className="grid grid-cols-4 gap-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all ${activeTab === tab.id ? 'text-white shadow-md' : 'bg-white text-gray-500 border'}`}
                style={activeTab === tab.id ? { background: tab.color } : { borderColor: '#E2E8F0' }}>
                <tab.icon size={16} />
                {tab.label.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Last Scan Analysis */}
          {scans.length > 0 && (
            <div className="card border-l-4" style={{ borderLeftColor: RISK_COLOR[scans[scans.length - 1].risk_level] || '#064E3B', marginBottom: '1.25rem' }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#0F172A' }}>Latest Scan Analysis</h3>
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    {new Date(scans[scans.length - 1].created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: `${RISK_COLOR[scans[scans.length - 1].risk_level] || '#64748B'}15`, color: RISK_COLOR[scans[scans.length - 1].risk_level] || '#64748B' }}>
                  {scans[scans.length - 1].risk_level} Risk
                </span>
              </div>
              <p className="text-sm mb-4" style={{ color: '#0F172A' }}>
                <span className="font-semibold" style={{ color: '#64748B' }}>Pattern:</span> {scans[scans.length - 1].infection_pattern || 'Unknown'}
              </p>
              <button 
                className="btn-primary w-full py-2 text-sm" 
                onClick={() => {
                  let rawResult = {};
                  let symptoms = {};
                  try { rawResult = JSON.parse(scans[scans.length - 1].raw_result || '{}'); } catch(e){}
                  try { symptoms = JSON.parse(scans[scans.length - 1].symptoms || '{}'); } catch(e){}
                  
                  navigate('/results', { 
                    state: { 
                      result: Object.keys(rawResult).length > 0 ? rawResult : { risk_level: scans[scans.length - 1].risk_level, infection_pattern: scans[scans.length - 1].infection_pattern, ai_explanation: scans[scans.length - 1].ai_explanation, recommendation: scans[scans.length - 1].recommendation }, 
                      vitals: { 
                        temperature_c: scans[scans.length - 1].temperature_c, 
                        spo2: scans[scans.length - 1].spo2, 
                        heart_rate: scans[scans.length - 1].heart_rate, 
                        humidity: scans[scans.length - 1].humidity 
                      }, 
                      questionnaire: { 
                        symptoms: symptoms,
                        travel_history: scans[scans.length - 1].travel_history || 0
                      } 
                    } 
                  });
                }}
              >
                View Full Detailed Report
              </button>
            </div>
          )}

          {/* Temporal Fever Curve Analyzer */}
          {scans.length > 0 && (
            <div className="card mb-5 border-t-4" style={{ borderTopColor: curveAnalysis.color, background: '#F8FAFC' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ background: `${curveAnalysis.color}20` }}>
                  <Activity size={20} color={curveAnalysis.color} />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: '#0F172A' }}>Temporal Fever Analyzer</h3>
                  <p className="text-xs" style={{ color: '#64748B' }}>Longitudinal Pattern Detection</p>
                </div>
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: curveAnalysis.color }}>
                {curveAnalysis.type}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                {curveAnalysis.desc}
              </p>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Average', value: `${avg}${activeTabData.unit}` },
              { label: 'Peak', value: `${max}${activeTabData.unit}` },
              { label: 'Low', value: `${min}${activeTabData.unit}` },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="card text-center py-4 px-2">
                <p className="text-xs mb-1" style={{ color: '#64748B' }}>{s.label}</p>
                <p className="text-base font-bold" style={{ color: activeTabData.color }}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Main Chart */}
          <div className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#0F172A' }}>
              <activeTabData.icon size={18} color={activeTabData.color} />
              {activeTabData.label} Over Time
            </h3>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeTabData.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={activeTabData.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={activeTab}
                    name={activeTabData.label}
                    stroke={activeTabData.color}
                    strokeWidth={2.5}
                    fill="url(#colorGrad)"
                    dot={{ r: 4, fill: activeTabData.color, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scan History List */}
          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: '#0F172A' }}>Recent Scans</h3>
            <div className="space-y-3">
              {[...scans].reverse().slice(0, 10).map((scan, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#F1F5F9' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#0F172A' }}>
                      {scan.infection_pattern || 'Unknown'}
                    </p>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>
                      {new Date(scan.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: '#64748B' }}>
                      {scan.temperature_c}°C
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${RISK_COLOR[scan.risk_level] || '#64748B'}15`, color: RISK_COLOR[scan.risk_level] || '#64748B' }}>
                      {scan.risk_level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

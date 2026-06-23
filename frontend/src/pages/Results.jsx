import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle, AlertTriangle, AlertOctagon, Siren, Activity, Thermometer, Heart, Droplets, Wind, Info, MapPin, ArrowLeft, ChevronRight, TrendingUp, FileText } from 'lucide-react';

const RISK_CONFIG = {
  Low: { color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle, message: 'No immediate concern. Continue monitoring.' },
  Moderate: { color: '#D97706', bg: '#FFFBEB', icon: AlertTriangle, message: 'Doctor consultation recommended soon.' },
  High: { color: '#EA580C', bg: '#FFF7ED', icon: AlertOctagon, message: 'Please consult a doctor within 24 hours.' },
  Critical: { color: '#DC2626', bg: '#FEF2F2', icon: Siren, message: 'Seek immediate medical attention.' },
};

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.result) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '50vh' }}>
        <p style={{ color: '#64748B' }} className="mb-4">No results found.</p>
        <button onClick={() => navigate('/')} className="btn-primary" style={{ maxWidth: 200 }}>Return Home</button>
      </div>
    );
  }

  const { result, vitals, questionnaire } = state;
  const riskConfig = RISK_CONFIG[result.risk_level] || RISK_CONFIG.Low;
  const RiskIcon = riskConfig.icon;

  const sortedPatterns = Object.entries(result.pattern_confidence || {}).sort((a, b) => b[1] - a[1]);
  const topPattern = sortedPatterns[0] || ['Unknown', 0];

  const parseMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className={`text-sm leading-relaxed ${line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.') ? 'mt-4 mb-1' : 'mb-1'}`} style={{ color: '#475569' }}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} style={{ color: '#0F172A' }}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  // Symptom Burden
  const symptomScores = questionnaire?.symptoms || {};
  const burdenScore = Object.values(symptomScores).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0) + (questionnaire?.travel_history || 0);
  const maxBurden = 42; // 13 symptoms + travel history * 3
  const burdenPct = Math.min(100, (burdenScore / maxBurden) * 100);
  const burdenLabel = burdenScore <= 14 ? 'Mild' : burdenScore <= 28 ? 'Moderate' : 'Severe';
  const burdenColor = burdenScore <= 14 ? '#16A34A' : burdenScore <= 28 ? '#D97706' : '#DC2626';

  // Alerts
  const alerts = [];
  if (vitals?.spo2 < 90) alerts.push({ level: 'critical', message: 'Dangerously low oxygen levels detected. Seek emergency care immediately.' });
  else if (vitals?.spo2 <= 94) alerts.push({ level: 'moderate', message: 'Below normal oxygen saturation. Doctor consultation advised.' });
  if (vitals?.temperature_c > 39.5) alerts.push({ level: 'critical', message: 'Very high fever detected. Seek immediate medical attention.' });
  if (vitals?.heart_rate > 130) alerts.push({ level: 'critical', message: 'Significantly elevated heart rate. Emergency evaluation recommended.' });

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2.5 bg-white rounded-xl shadow-sm border" style={{ borderColor: '#E2E8F0' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Your Health Report</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Based on your symptoms and vitals</p>
        </div>
      </div>

      {/* Section 7: Emergency Alerts */}
      {alerts.map((alert, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex gap-3 border-2"
          style={{ background: alert.level === 'critical' ? '#FEF2F2' : '#FFFBEB', borderColor: alert.level === 'critical' ? '#FECACA' : '#FDE68A' }}
        >
          <ShieldAlert size={22} color={alert.level === 'critical' ? '#DC2626' : '#D97706'} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium" style={{ color: alert.level === 'critical' ? '#991B1B' : '#92400E' }}>{alert.message}</p>
        </motion.div>
      ))}

      {/* Section 1: Triage Level */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl p-6 border-l-4"
        style={{ background: riskConfig.bg, borderLeftColor: riskConfig.color }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: riskConfig.color }}>Risk Level</p>
            <h2 className="text-3xl font-bold" style={{ color: riskConfig.color }}>{result.risk_level}</h2>
            <p className="text-sm mt-2" style={{ color: '#64748B' }}>{riskConfig.message}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${riskConfig.color}15` }}>
            <RiskIcon size={28} color={riskConfig.color} />
          </div>
        </div>
      </motion.div>

      {/* Section 2: Infection Pattern */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>Predicted Probabilistic Score</h3>
          <p className="text-2xl font-bold" style={{ color: '#0F172A' }}>
            {topPattern[0]}
            <span className="text-lg font-medium ml-2" style={{ color: '#064E3B' }}>
              {(topPattern[1] * 100).toFixed(0)}% Match
            </span>
          </p>
        </div>
        <div className="space-y-3 pt-4 border-t border-gray-100">
          {sortedPatterns.map(([pattern, prob]) => (
            <div key={pattern}>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span style={{ color: '#0F172A' }}>{pattern}</span>
                <span style={{ color: '#64748B' }}>{(prob * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: '#E2E8F0' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${prob * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-2 rounded-full" style={{ background: '#064E3B' }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: '#94A3B8' }}>These patterns are statistical indicators, not medical diagnoses.</p>
      </div>

      {/* Section 3: Explainable AI Report */}
      <div className="card border-t-4" style={{ borderTopColor: '#2563EB', background: '#F8FAFC' }}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Info size={20} color="#2563EB" />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: '#1E3A8A' }}>Explainable AI (XAI) Report</h3>
            <p className="text-xs" style={{ color: '#3B82F6' }}>Generated Clinical Reasoning</p>
          </div>
        </div>
        <div className="ai-report-content">
          {parseMarkdown(result.ai_explanation) || (
            <p className="text-sm text-gray-500">Analysis could not be generated. Please consult a doctor.</p>
          )}
        </div>
      </div>

      {/* Section 4: Vital Signs Summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Temperature', value: vitals?.temperature_c, unit: '°C', icon: Thermometer, range: '36.1–37.2°C' },
          { label: 'SpO2', value: vitals?.spo2, unit: '%', icon: Droplets, range: '95–100%' },
          { label: 'Heart Rate', value: vitals?.heart_rate, unit: 'bpm', icon: Heart, range: '60–100 bpm' },
          { label: 'Humidity', value: vitals?.humidity, unit: '%', icon: Wind, range: '30–60%' },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="card text-center py-4 px-3">
            <item.icon size={20} color="#064E3B" className="mx-auto mb-2" />
            <p className="text-xl font-bold" style={{ color: '#0F172A' }}>{item.value || '—'}</p>
            <p className="text-xs" style={{ color: '#64748B' }}>{item.unit}</p>
            <p className="text-[10px] mt-1" style={{ color: '#94A3B8' }}>{item.range}</p>
          </motion.div>
        ))}
      </div>

      {/* Section 5: Symptom Burden */}
      <div className="card">
        <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>Symptom Burden Index</h3>
        <p className="text-xs mb-3" style={{ color: '#64748B' }}>Score: {burdenScore} / {maxBurden}</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full" style={{ background: '#E2E8F0' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${burdenPct}%` }}
              transition={{ duration: 0.8 }} className="h-3 rounded-full"
              style={{ background: burdenColor }} />
          </div>
          <span className="text-sm font-bold" style={{ color: burdenColor }}>{burdenLabel}</span>
        </div>
      </div>

      {/* Section 6: Recommendations */}
      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: '#0F172A' }}>What To Do Next</h3>
        <div className="space-y-3">
          <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{result.recommendation}</p>
        </div>
      </div>

      {/* Section 8: Action Buttons */}
      <div className="space-y-3 pt-2">
        <button className="btn-primary" onClick={() => navigate('/nearby-doctors', { state: { result } })}>
          <MapPin size={18} /> Find Nearby Doctors
        </button>
        <button className="btn-secondary" onClick={() => navigate('/trends')}>
          <TrendingUp size={18} /> View My Health Trends
        </button>
        <button className="btn-ghost" onClick={() => navigate('/scan/medical-history')}>
          <Activity size={18} /> Start New Scan
        </button>
      </div>
    </div>
  );
}

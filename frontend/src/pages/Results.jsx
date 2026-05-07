import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Activity, Heart, Thermometer, Info, MapPin, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockTrendData = [
  { day: 'Mon', temp: 98.6, spo2: 98 },
  { day: 'Tue', temp: 99.1, spo2: 97 },
  { day: 'Wed', temp: 100.5, spo2: 96 },
  { day: 'Thu', temp: 101.8, spo2: 94 },
  { day: 'Fri', temp: 102.1, spo2: 93 },
  { day: 'Sat', temp: 101.5, spo2: 95 },
  { day: 'Sun', temp: 99.8, spo2: 97 },
];

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.result) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-gray-500 mb-4">No results found.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Return Home</button>
      </div>
    );
  }

  const { result, sensors, questionnaire } = state;

  const riskColors = {
    'Low': 'bg-risk-low text-white',
    'Moderate': 'bg-risk-moderate text-white',
    'High': 'bg-risk-high text-white',
    'Critical': 'bg-risk-critical text-white'
  };

  const getSymptomBurden = () => {
    let score = 0;
    Object.values(questionnaire.symptoms).forEach(val => {
      if (val === 'Mild') score += 1;
      if (val === 'Moderate') score += 2;
      if (val === 'Severe') score += 3;
    });
    if (score < 4) return { label: 'Mild', width: '33%', color: 'bg-green-500' };
    if (score < 8) return { label: 'Moderate', width: '66%', color: 'bg-yellow-500' };
    return { label: 'Severe', width: '100%', color: 'bg-red-500' };
  };

  const burden = getSymptomBurden();

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Triage Report</h1>
      </div>

      {/* Alert System */}
      {(sensors.spo2 < 90 || sensors.temperature_c > 39.4 || sensors.heart_rate > 130) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <h4 className="text-red-800 font-bold">Critical Alert</h4>
            <p className="text-red-700 text-sm">Vitals are outside safe ranges. Immediate medical attention is required.</p>
          </div>
        </motion.div>
      )}

      {/* Triage Level Card */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-2xl p-6 shadow-lg ${riskColors[result.risk_level]}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/80 font-medium text-sm">Assessed Risk Level</p>
            <h2 className="text-4xl font-bold tracking-tight mt-1">{result.risk_level}</h2>
          </div>
          <Activity className="w-10 h-10 opacity-50" />
        </div>
        <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-sm leading-relaxed font-medium">
            {result.recommendation}
          </p>
        </div>
      </motion.div>

      {/* AI Explanation */}
      <div className="card border-l-4 border-l-medical-teal">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-medical-teal" /> Clinical Reasoning
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {result.ai_explanation || "Based on the provided vitals and symptoms, the clinical risk profile aligns with the assessed level."}
        </p>
      </div>

      {/* Infection Pattern Probabilities */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900">Pattern Analysis</h3>
        <div className="space-y-3">
          {Object.entries(result.pattern_confidence)
            .sort((a, b) => b[1] - a[1])
            .map(([pattern, prob]) => (
            <div key={pattern}>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-gray-700">{pattern}</span>
                <span className="text-gray-500">{(prob * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${prob * 100}%` }}
                  className="bg-gray-900 h-2 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensor Vitals Recap */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 flex flex-col items-center justify-center text-center">
          <Thermometer className="w-6 h-6 text-gray-900 mb-2" />
          <span className="text-2xl font-bold text-gray-900">{sensors.temperature_c}°C</span>
          <span className="text-xs text-gray-500">Temperature</span>
        </div>
        <div className="card p-4 flex flex-col items-center justify-center text-center">
          <Heart className="w-6 h-6 text-gray-900 mb-2" />
          <span className="text-2xl font-bold text-gray-900">{sensors.heart_rate}</span>
          <span className="text-xs text-gray-500">Heart Rate</span>
        </div>
      </div>

      {/* Symptom Burden Index */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Symptom Burden Index</h3>
        <div className="flex justify-between text-xs font-medium mb-1">
          <span className="text-gray-700">{burden.label} Burden</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: burden.width }}
            className={`${burden.color} h-3 rounded-full`}
          />
        </div>
      </div>

      {/* Trend Graph */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">7-Day Vitals Trend</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockTrendData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis yAxisId="left" domain={['dataMin - 1', 'dataMax + 1']} hide />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#111827" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nearby Facilities */}
      <div className="card bg-gray-50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-gray-500" /> Nearby Healthcare
        </h3>
        <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative">
          {/* Mock Google Maps view */}
          <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=hospital&zoom=14&size=600x300&maptype=roadmap&key=YOUR_API_KEY_HERE')] bg-cover bg-center opacity-30 grayscale blur-[1px]"></div>
          <div className="relative z-10 bg-white/90 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 shadow-sm">
            Map View Unavailable in Demo
          </div>
        </div>
      </div>

    </div>
  );
}

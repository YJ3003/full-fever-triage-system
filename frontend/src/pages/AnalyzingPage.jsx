import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, Brain, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const STAGES = [
  { icon: Shield, text: 'Sending data securely...', color: '#064E3B' },
  { icon: Activity, text: 'Running risk analysis...', color: '#0EA5E9' },
  { icon: Brain, text: 'Generating AI insights...', color: '#7C3AED' },
  { icon: CheckCircle, text: 'Preparing your report...', color: '#16A34A' },
];

export default function AnalyzingPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { saveScane } = useAuth();
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!state?.questionnaire || !state?.vitals) {
      navigate('/scan/medical-history');
      return;
    }

    const runAnalysis = async () => {
      // Animate through stages with delays
      const advanceStage = (i) => new Promise(r => setTimeout(() => { setStageIndex(i); r(); }, 1000));
      await advanceStage(1);
      await advanceStage(2);

      try {
        const q = state.questionnaire;
        const ppg = state.ppg || {};

        // Use PPG HR if available and no sensor HR, or as HRV source
        const effectiveHR = state.vitals.heart_rate || ppg.ppg_hr || 75;
        const effectiveHRV = ppg.hrv_ms || null;

        const payload = {
          temperature_c: state.vitals.temperature_c,
          heart_rate: effectiveHR,
          spo2: state.vitals.spo2,
          humidity: state.vitals.humidity || 50,
          hrv: effectiveHRV,
          age: parseInt(q.age) || 30,
          gender: q.gender,
          fever_days: [0, 2, 5, 8][q.fever_duration] || 0,
          medical_history: Object.values(state.medicalHistory || {}).filter(Boolean).join('. '),
          headache: q.symptoms?.headache || 0,
          cough: q.symptoms?.cough || 0,
          vomiting: q.symptoms?.vomiting || 0,
          myalgia: q.symptoms?.myalgia || 0,
          rash: q.symptoms?.rash || 0,
          rigors: q.symptoms?.rigors || 0,
          sweating: q.symptoms?.sweating || 0,
          travel_history: q.travel_history || 0,
        };

        const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
        const response = await axios.post(`${API_URL}/predict`, payload);
        const result = response.data;

        await advanceStage(3);
        await new Promise(r => setTimeout(r, 600));

        // Save scan to Supabase (non-blocking — don't fail if no auth)
        const symptomScores = q.symptoms || {};
        const burdenScore = Object.values(symptomScores).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) + (q.travel_history || 0);

        try {
          await saveScane({
            temperature_c: state.vitals.temperature_c,
            heart_rate: effectiveHR,
            spo2: state.vitals.spo2,
            humidity: state.vitals.humidity || 50,
            hrv_ms: effectiveHRV,
            ppg_hr: ppg.ppg_hr || null,
            risk_level: result.risk_level,
            infection_pattern: result.infection_pattern,
            ai_explanation: result.ai_explanation,
            recommendation: result.recommendation,
            symptom_burden: burdenScore,
            fever_days: payload.fever_days,
            age: payload.age,
            gender: payload.gender,
            medical_history: payload.medical_history,
            symptoms: JSON.stringify(q.symptoms || {}),
            raw_result: JSON.stringify(result),
          });
        } catch (dbErr) {
          console.warn('Supabase save failed (not critical):', dbErr);
        }

        navigate('/results', {
          state: {
            result,
            vitals: { ...state.vitals, heart_rate: effectiveHR },
            questionnaire: q,
            medicalHistory: state.medicalHistory,
            ppg,
          },
        });
      } catch (err) {
        console.error('Analysis error:', err);
        const msg = err?.response?.data?.detail || err?.message || 'Unknown error';
        alert(`Analysis failed: ${msg}\n\nMake sure the backend is running on port 8000.`);
        navigate('/');
      }
    };

    runAnalysis();
  }, []);

  const CurrentIcon = STAGES[stageIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '75vh' }}>
      <motion.div
        key={stageIndex}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center px-4"
      >
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full animate-ping-slow" style={{ background: `${STAGES[stageIndex].color}20` }} />
          <div className="relative w-28 h-28 rounded-full flex items-center justify-center" style={{ background: `${STAGES[stageIndex].color}15` }}>
            <CurrentIcon size={40} color={STAGES[stageIndex].color} />
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>{STAGES[stageIndex].text}</h2>
        <p className="text-sm" style={{ color: '#64748B' }}>Please wait while we analyse your health data</p>

        <div className="flex items-center justify-center gap-2.5 mt-10">
          {STAGES.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-500"
              style={{
                width: i === stageIndex ? 24 : 8,
                height: 8,
                background: i <= stageIndex ? '#064E3B' : '#E2E8F0',
              }} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

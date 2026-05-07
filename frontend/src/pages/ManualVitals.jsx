import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function ManualVitals() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const questionnaire = state?.questionnaire;

  const prefilled = state?.prefilledVitals || {};

  const [vitals, setVitals] = useState({
    temperature_c: '',
    heart_rate: prefilled.heart_rate?.toString() || '',
    spo2: '',
    humidity: '50',
    hrv: prefilled.hrv?.toString() || ''
  });
  const [loading, setLoading] = useState(false);

  const updateVital = (key, value) => setVitals(v => ({ ...v, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionnaire) {
      alert("Missing questionnaire data!");
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        temperature_c: parseFloat(vitals.temperature_c),
        heart_rate: parseInt(vitals.heart_rate),
        spo2: parseInt(vitals.spo2),
        humidity: parseFloat(vitals.humidity) || 50.0,
        hrv: vitals.hrv ? parseFloat(vitals.hrv) : null,
        age: parseInt(questionnaire.age) || 30,
        fever_days: parseInt(questionnaire.fever_duration) || 0,
        gender: questionnaire.gender,
        medical_history: questionnaire.history,
        ...questionnaire.symptoms
      };

      const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/predict`, payload);
      
      navigate('/results', { state: { result: response.data, sensors: vitals, questionnaire } });
    } catch (error) {
      console.error(error);
      alert("Failed to connect to API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all border border-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manual Vitals</h1>
          <p className="text-sm text-gray-500 font-medium">Enter patient readings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          
          <div className="card p-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Temperature (°C)</label>
              <input 
                type="number" step="0.1" required
                value={vitals.temperature_c}
                onChange={e => updateVital('temperature_c', e.target.value)}
                className="input-field" placeholder="e.g. 38.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Heart Rate (bpm)</label>
              <input 
                type="number" required
                value={vitals.heart_rate}
                onChange={e => updateVital('heart_rate', e.target.value)}
                className="input-field" placeholder="e.g. 95"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">SpO2 (%)</label>
              <input 
                type="number" required
                value={vitals.spo2}
                onChange={e => updateVital('spo2', e.target.value)}
                className="input-field" placeholder="e.g. 98"
              />
            </div>
          </div>

          <div className="card p-5 space-y-5">
            <h3 className="font-semibold text-gray-900 mb-2">Optional Fields</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Humidity (%)</label>
              <input 
                type="number"
                value={vitals.humidity}
                onChange={e => updateVital('humidity', e.target.value)}
                className="input-field" placeholder="e.g. 50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">HRV (ms)</label>
              <input 
                type="number" step="0.1"
                value={vitals.hrv}
                onChange={e => updateVital('hrv', e.target.value)}
                className="input-field" placeholder="Auto-calculated if left blank"
              />
            </div>
          </div>

        </motion.div>

        <div className="pt-6">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Activity className="w-5 h-5 animate-spin" /> : 'Run Triage AI'}
            {!loading && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}

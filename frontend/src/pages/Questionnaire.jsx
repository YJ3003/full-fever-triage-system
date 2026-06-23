import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Brain, Wind, AlertCircle, Zap, Layers, Snowflake, Droplets, MapPin, Eye, Activity, Heart } from 'lucide-react';

const SYMPTOMS = [
  { id: 'headache', icon: Brain, question: 'How severe is your headache?', description: 'Include any throbbing, pressure, or location-specific pain' },
  { id: 'cough', icon: Wind, question: 'How severe is your cough?', description: 'Include dry cough, wet cough, or persistent coughing fits' },
  { id: 'vomiting', icon: AlertCircle, question: 'Have you experienced vomiting or nausea?', description: 'Include frequency and intensity' },
  { id: 'myalgia', icon: Zap, question: 'Are you experiencing body or muscle pain?', description: 'Include joint pain, body aches, or generalized soreness' },
  { id: 'rash', icon: Layers, question: 'Have you noticed skin rash or red spots?', description: 'Include any unusual skin changes, spots, or irritation' },
  { id: 'rigors', icon: Snowflake, question: 'Have you experienced chills or shivering?', description: 'Include sudden cold feelings despite high temperature' },
  { id: 'sweating', icon: Droplets, question: 'Are you experiencing unusual sweating?', description: 'Include night sweats or excessive perspiration' },
  { id: 'petechiae', icon: Layers, question: 'Do you have tiny red/purple spots on skin (petechiae)?', description: 'Small dot-like hemorrhages under the skin' },
  { id: 'retroorbital_pain', icon: Eye, question: 'Is your headache behind your eyes?', description: 'Pain specifically located behind the eyes' },
  { id: 'cyclical_fever', icon: Activity, question: 'Is the fever coming in regular waves?', description: 'Feeling fine in between fever spikes' },
  { id: 'dark_urine', icon: Droplets, question: 'Have you noticed your urine is darker or less frequent?', description: 'Sign of potential dehydration or kidney stress' },
  { id: 'stomach_pain', icon: AlertCircle, question: 'Do you have stomach or abdominal pain?', description: 'Any persistent dull or sharp pain' },
  { id: 'bleeding_tendency', icon: Heart, question: 'Any bleeding gums, nose bleeds, or easy bruising?', description: 'Unusual bleeding tendencies' },
];

const SEVERITY_OPTIONS = [
  { label: 'None', value: 0, chipClass: 'chip-unselected' },
  { label: 'Mild', value: 1, selectedClass: 'chip-mild-selected' },
  { label: 'Moderate', value: 2, selectedClass: 'chip-moderate-selected' },
  { label: 'Severe', value: 3, selectedClass: 'chip-severe-selected' },
];

const TRAVEL_OPTIONS = [
  { label: 'No Travel', value: 0 },
  { label: 'Nearby', value: 1 },
  { label: 'Intercity', value: 2 },
  { label: 'International', value: 3 },
];

const FEVER_OPTIONS = [
  { label: '< 1 Day', value: 0 },
  { label: '1–3 Days', value: 1 },
  { label: '4–7 Days', value: 2 },
  { label: '> 7 Days', value: 3 },
];

export default function Questionnaire() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const medicalHistory = state?.medicalHistory || {};

  const [step, setStep] = useState(1); // 1 = basic info, 2 = symptoms
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  
  const [formData, setFormData] = useState({
    age: '',
    gender: 'Male',
    fever_duration: 0,
    symptoms: SYMPTOMS.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {}),
    travel_history: 0,
    recent_vaccination: false,
  });

  const updateSymptom = (id, val) => setFormData(f => ({ ...f, symptoms: { ...f.symptoms, [id]: val } }));

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else {
      navigate('/scan/hardware', { state: { medicalHistory, questionnaire: formData } });
    }
  };

  const getChipClass = (currentVal, optionVal, option) => {
    if (currentVal === optionVal) {
      if (optionVal === 0) return 'chip chip-selected';
      return `chip ${option.selectedClass || 'chip-selected'}`;
    }
    return 'chip chip-unselected';
  };

  return (
    <div className="pb-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => step > 1 ? setStep(1) : navigate(-1)} className="p-2.5 bg-white rounded-xl shadow-sm border" style={{ borderColor: '#E2E8F0' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Symptom Assessment</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Step 2 of 4 · {step === 1 ? 'Basic Information' : 'Current Symptoms'}</p>
        </div>
      </div>

      <div className="step-progress mb-8">
        <div className="step-progress-fill" style={{ width: '50%' }} />
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <h2 className="text-lg font-bold" style={{ color: '#0F172A' }}>Basic Information</h2>

          <div className="card">
            <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>Your Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={e => setFormData(f => ({ ...f, age: e.target.value }))}
              className="input-field"
              placeholder="e.g. 30"
              required
            />
          </div>

          {formData.age !== '' && parseInt(formData.age) <= 12 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card border-l-4" style={{ borderLeftColor: '#3B82F6', background: '#EFF6FF' }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1E3A8A' }}>Pediatric Triage: Recent Vaccination?</label>
              <p className="text-xs mb-3" style={{ color: '#2563EB' }}>Has the child received any vaccination in the last 48 hours? (Helps prevent false alarms for vaccine-induced fevers).</p>
              <div className="grid grid-cols-2 gap-2">
                <div onClick={() => setFormData(f => ({ ...f, recent_vaccination: true }))} className={`chip ${formData.recent_vaccination ? 'chip-selected' : 'chip-unselected'}`} style={formData.recent_vaccination ? { background: '#2563EB', color: 'white', borderColor: '#2563EB' } : {}}>Yes</div>
                <div onClick={() => setFormData(f => ({ ...f, recent_vaccination: false }))} className={`chip ${!formData.recent_vaccination ? 'chip-selected' : 'chip-unselected'}`} style={!formData.recent_vaccination ? { background: '#2563EB', color: 'white', borderColor: '#2563EB' } : {}}>No</div>
              </div>
            </motion.div>
          )}

          <div className="card">
            <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>Gender</label>
            <select
              value={formData.gender}
              onChange={e => setFormData(f => ({ ...f, gender: e.target.value }))}
              className="input-field"
              style={{ background: 'white' }}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
            </select>
          </div>

          <div className="card">
            <label className="block text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>How long have you had fever?</label>
            <div className="grid grid-cols-2 gap-2">
              {FEVER_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setFormData(f => ({ ...f, fever_duration: opt.value }))}
                  className={formData.fever_duration === opt.value ? 'chip chip-selected' : 'chip chip-unselected'}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#0F172A' }}>Current Symptoms</h2>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Select the severity of each symptom you're experiencing</p>
          </div>

          {SYMPTOMS.map((sym, i) => {
            const Icon = sym.icon;
            return (
              <motion.div
                key={sym.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#ECFDF5' }}>
                    <Icon size={18} color="#064E3B" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{sym.question}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{sym.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITY_OPTIONS.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => updateSymptom(sym.id, opt.value)}
                      className={getChipClass(formData.symptoms[sym.id], opt.value, opt)}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* Travel History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: SYMPTOMS.length * 0.08 }}
            className="card"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#ECFDF5' }}>
                <MapPin size={18} color="#064E3B" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Have you recently traveled to unfamiliar or high-risk areas?</p>
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Travel in the past 14 days that may have involved exposure</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TRAVEL_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setFormData(f => ({ ...f, travel_history: opt.value }))}
                  className={formData.travel_history === opt.value ? 'chip chip-selected' : 'chip chip-unselected'}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </motion.div>

          <p className="text-xs" style={{ color: '#94A3B8' }}>
            ℹ️ Only binary values (0/1) are sent to ML models. Severity scores (0-3) are stored separately for analytics.
          </p>
        </motion.div>
      )}

      <div className="mt-8">
        <button onClick={handleContinue} className="btn-primary">
          {step === 1 ? 'Continue to Symptoms' : 'Continue to Sensor Data'} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

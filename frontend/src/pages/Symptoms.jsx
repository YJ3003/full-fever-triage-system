import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Brain, Wind, AlertCircle, Zap, Layers, Snowflake, Droplets, MapPin, Eye, Activity, Heart } from 'lucide-react';

const SYMPTOMS = [
  { id: 'headache', icon: Brain, question: 'Does the patient have a headache?', description: 'Throbbing, pressure, or general head pain', isSubjective: true },
  { id: 'cough', icon: Wind, question: 'How severe is the patient\'s cough?', description: 'Dry, wet, or persistent coughing fits', isSubjective: false },
  { id: 'vomiting', icon: AlertCircle, question: 'Does the patient have vomiting or nausea?', description: 'Frequency and intensity of throwing up', isSubjective: false },
  { id: 'myalgia', icon: Zap, question: 'Does the patient have muscle or body aches?', description: 'Joint pain or generalized body soreness', isSubjective: true },
  { id: 'rash', icon: Layers, question: 'Does the patient have a skin rash?', description: 'Unusual red skin changes or irritation', isSubjective: false },
  { id: 'rigors', icon: Snowflake, question: 'Does the patient have severe chills or shivering?', description: 'Sudden cold feelings despite a high fever', isSubjective: false },
  { id: 'sweating', icon: Droplets, question: 'Does the patient have unusual or heavy sweating?', description: 'Night sweats or excessive perspiration', isSubjective: false },
  { id: 'petechiae', icon: Layers, question: 'Does the patient have tiny red/purple spots on skin?', description: 'Small dot-like marks that do not fade when pressed', isSubjective: false },
  { id: 'retroorbital_pain', icon: Eye, question: 'Does the patient complain of pain behind the eyes?', description: 'A deep ache located behind the eyeballs', isSubjective: true },
  { id: 'cyclical_fever', icon: Activity, question: 'Is the patient\'s fever coming in waves?', description: 'Feeling completely fine in between sudden fever spikes', isSubjective: false },
  { id: 'dark_urine', icon: Droplets, question: 'Is the patient\'s urine very dark or infrequent?', description: 'Sign of potential dehydration', isSubjective: false },
  { id: 'stomach_pain', icon: AlertCircle, question: 'Does the patient have stomach or abdominal pain?', description: 'Persistent dull or sharp pain in the belly', isSubjective: true },
  { id: 'bleeding_tendency', icon: Heart, question: 'Does the patient bruise or bleed easily?', description: 'Bleeding gums, frequent nosebleeds, or unexplained bruises', isSubjective: false },
  { id: 'diarrhea', icon: Droplets, question: 'Does the patient have diarrhea or loose stools?', description: 'Frequent watery bowel movements', isSubjective: false },
  { id: 'ear_pain', icon: AlertCircle, question: 'Does the patient have ear pain or pull at their ears?', description: 'Signs of ear infection (common in kids)', isSubjective: false },
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

export default function Symptoms() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const medicalHistory = state?.medicalHistory || {};

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState(() => {
    const base = state?.questionnaire || {};
    return {
      ...base,
      age: base.age || '30',
      symptoms: base.symptoms || SYMPTOMS.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {}),
      travel_history: base.travel_history || 0
    };
  });

  const updateSymptom = (id, val) => setFormData(f => ({ ...f, symptoms: { ...f.symptoms, [id]: val } }));

  const handleContinue = () => {
    navigate('/scan/hardware', { state: { medicalHistory, questionnaire: formData } });
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
        <button onClick={() => navigate('/scan/questionnaire', { state: { medicalHistory, questionnaire: formData } })} className="p-2.5 bg-white rounded-xl shadow-sm border" style={{ borderColor: '#E2E8F0' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Symptom Assessment</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Step 3 of 4 · Current Symptoms</p>
        </div>
      </div>

      <div className="step-progress mb-8">
        <div className="step-progress-fill" style={{ width: '75%' }} />
      </div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#0F172A' }}>Current Symptoms</h2>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Select the severity of each symptom you're experiencing</p>
        </div>

        {SYMPTOMS.map((sym, i) => {
          const isInfant = formData.age !== '' && parseInt(formData.age) <= 3;
          if (isInfant && sym.isSubjective) return null; // Skip subjective symptoms for infants

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
          ℹ️ We automatically filter out certain questions for young children that they cannot accurately report.
        </p>
      </motion.div>

      <div className="mt-8">
        <button onClick={handleContinue} className="btn-primary">
          Continue to Sensor Data <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

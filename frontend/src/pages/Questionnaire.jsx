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

  const [formData, setFormData] = useState(state?.questionnaire || {
    age: '',
    gender: 'Male',
    fever_duration: 0,
    symptoms: SYMPTOMS.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {}),
    travel_history: 0,
    recent_vaccination: false,
    unusually_drowsy: false,
    struggling_to_breathe: false,
    severe_dehydration: false,
    seizures: false,
    stiff_neck: false,
    is_pregnant: false,
    is_immunocompromised: false,
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
        <button onClick={() => step > 1 ? setStep(1) : navigate(-1, { state: { medicalHistory } })} className="p-2.5 bg-white rounded-xl shadow-sm border" style={{ borderColor: '#E2E8F0' }}>
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

          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card border-l-4" style={{ borderLeftColor: '#EF4444', background: '#FEF2F2' }}>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#991B1B' }}>🚨 Critical Red Flags</label>
            <p className="text-xs mb-3" style={{ color: '#DC2626' }}>Please answer immediately. These indicate a potential emergency.</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium pr-2" style={{ color: '#7F1D1D' }}>Is the patient unusually drowsy, confused, or unresponsive?</span>
                <div className="grid grid-cols-2 gap-1 w-24 shrink-0">
                  <div onClick={() => setFormData(f => ({ ...f, unusually_drowsy: true }))} className={`chip text-center py-1 px-1 ${formData.unusually_drowsy ? 'chip-selected' : 'chip-unselected'}`} style={formData.unusually_drowsy ? { background: '#EF4444', color: 'white', borderColor: '#EF4444' } : {}}>Yes</div>
                  <div onClick={() => setFormData(f => ({ ...f, unusually_drowsy: false }))} className={`chip text-center py-1 px-1 ${!formData.unusually_drowsy ? 'chip-selected' : 'chip-unselected'}`} style={!formData.unusually_drowsy ? { background: '#EF4444', color: 'white', borderColor: '#EF4444' } : {}}>No</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium pr-2" style={{ color: '#7F1D1D' }}>Is the patient struggling to breathe or breathing very fast?</span>
                <div className="grid grid-cols-2 gap-1 w-24 shrink-0">
                  <div onClick={() => setFormData(f => ({ ...f, struggling_to_breathe: true }))} className={`chip text-center py-1 px-1 ${formData.struggling_to_breathe ? 'chip-selected' : 'chip-unselected'}`} style={formData.struggling_to_breathe ? { background: '#EF4444', color: 'white', borderColor: '#EF4444' } : {}}>Yes</div>
                  <div onClick={() => setFormData(f => ({ ...f, struggling_to_breathe: false }))} className={`chip text-center py-1 px-1 ${!formData.struggling_to_breathe ? 'chip-selected' : 'chip-unselected'}`} style={!formData.struggling_to_breathe ? { background: '#EF4444', color: 'white', borderColor: '#EF4444' } : {}}>No</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium pr-2" style={{ color: '#7F1D1D' }}>Is the patient refusing all fluids or had no urine for 8+ hours?</span>
                <div className="grid grid-cols-2 gap-1 w-24 shrink-0">
                  <div onClick={() => setFormData(f => ({ ...f, severe_dehydration: true }))} className={`chip text-center py-1 px-1 ${formData.severe_dehydration ? 'chip-selected' : 'chip-unselected'}`} style={formData.severe_dehydration ? { background: '#EF4444', color: 'white', borderColor: '#EF4444' } : {}}>Yes</div>
                  <div onClick={() => setFormData(f => ({ ...f, severe_dehydration: false }))} className={`chip text-center py-1 px-1 ${!formData.severe_dehydration ? 'chip-selected' : 'chip-unselected'}`} style={!formData.severe_dehydration ? { background: '#EF4444', color: 'white', borderColor: '#EF4444' } : {}}>No</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium pr-2" style={{ color: '#7F1D1D' }}>Has the patient had any seizures or convulsions?</span>
                <div className="grid grid-cols-2 gap-1 w-24 shrink-0">
                  <div onClick={() => setFormData(f => ({ ...f, seizures: true }))} className={`chip text-center py-1 px-1 ${formData.seizures ? 'chip-selected' : 'chip-unselected'}`} style={formData.seizures ? { background: '#EF4444', color: 'white', borderColor: '#EF4444' } : {}}>Yes</div>
                  <div onClick={() => setFormData(f => ({ ...f, seizures: false }))} className={`chip text-center py-1 px-1 ${!formData.seizures ? 'chip-selected' : 'chip-unselected'}`} style={!formData.seizures ? { background: '#EF4444', color: 'white', borderColor: '#EF4444' } : {}}>No</div>
                </div>
              </div>

              {(!formData.age || parseInt(formData.age) > 3) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium pr-2" style={{ color: '#7F1D1D' }}>Does the patient have a stiff neck or inability to bend neck?</span>
                  <div className="grid grid-cols-2 gap-1 w-24 shrink-0">
                    <div onClick={() => setFormData(f => ({ ...f, stiff_neck: true }))} className={`chip text-center py-1 px-1 ${formData.stiff_neck ? 'chip-selected' : 'chip-unselected'}`} style={formData.stiff_neck ? { background: '#EF4444', color: 'white', borderColor: '#EF4444' } : {}}>Yes</div>
                    <div onClick={() => setFormData(f => ({ ...f, stiff_neck: false }))} className={`chip text-center py-1 px-1 ${!formData.stiff_neck ? 'chip-selected' : 'chip-unselected'}`} style={!formData.stiff_neck ? { background: '#EF4444', color: 'white', borderColor: '#EF4444' } : {}}>No</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="card">
            <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>Gender</label>
            <select
              value={formData.gender}
              onChange={e => {
                const newGender = e.target.value;
                setFormData(f => ({ ...f, gender: newGender, is_pregnant: newGender === 'Female' ? f.is_pregnant : false }));
              }}
              className="input-field"
              style={{ background: 'white' }}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Prefer not to say</option>
            </select>
          </div>

          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card border-l-4" style={{ borderLeftColor: '#F59E0B', background: '#FFFBEB' }}>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#B45309' }}>⚠️ Special Clinical Conditions</label>
            <p className="text-xs mb-3" style={{ color: '#D97706' }}>These factors significantly alter fever triage guidelines.</p>
            <div className="space-y-3">
              {formData.gender === 'Female' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium pr-2" style={{ color: '#92400E' }}>Is the patient currently pregnant?</span>
                  <div className="grid grid-cols-2 gap-1 w-24 shrink-0">
                    <div onClick={() => setFormData(f => ({ ...f, is_pregnant: true }))} className={`chip text-center py-1 px-1 ${formData.is_pregnant ? 'chip-selected' : 'chip-unselected'}`} style={formData.is_pregnant ? { background: '#F59E0B', color: 'white', borderColor: '#F59E0B' } : {}}>Yes</div>
                    <div onClick={() => setFormData(f => ({ ...f, is_pregnant: false }))} className={`chip text-center py-1 px-1 ${!formData.is_pregnant ? 'chip-selected' : 'chip-unselected'}`} style={!formData.is_pregnant ? { background: '#F59E0B', color: 'white', borderColor: '#F59E0B' } : {}}>No</div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium pr-2" style={{ color: '#92400E' }}>Is the patient immunocompromised (e.g., Chemo, Transplant, HIV)?</span>
                <div className="grid grid-cols-2 gap-1 w-24 shrink-0">
                  <div onClick={() => setFormData(f => ({ ...f, is_immunocompromised: true }))} className={`chip text-center py-1 px-1 ${formData.is_immunocompromised ? 'chip-selected' : 'chip-unselected'}`} style={formData.is_immunocompromised ? { background: '#F59E0B', color: 'white', borderColor: '#F59E0B' } : {}}>Yes</div>
                  <div onClick={() => setFormData(f => ({ ...f, is_immunocompromised: false }))} className={`chip text-center py-1 px-1 ${!formData.is_immunocompromised ? 'chip-selected' : 'chip-unselected'}`} style={!formData.is_immunocompromised ? { background: '#F59E0B', color: 'white', borderColor: '#F59E0B' } : {}}>No</div>
                </div>
              </div>
            </div>
          </motion.div>

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
      )}

      <div className="mt-8">
        <button onClick={handleContinue} className="btn-primary">
          {step === 1 ? 'Continue to Symptoms' : 'Continue to Sensor Data'} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

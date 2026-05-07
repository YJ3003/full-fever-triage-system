import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const SYMPTOMS = [
  { id: 'headache', label: 'Headache' },
  { id: 'cough', label: 'Cough' },
  { id: 'vomiting', label: 'Vomiting' },
  { id: 'myalgia', label: 'Muscle Pain' },
  { id: 'rash', label: 'Rash' },
  { id: 'rigors', label: 'Chills' },
  { id: 'sweating', label: 'Sweating' },
  { id: 'travel_history', label: 'Recent Travel' }
];

export default function Questionnaire() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    history: '',
    age: '',
    gender: 'Other',
    fever_duration: '0',
    symptoms: SYMPTOMS.reduce((acc, s) => ({ ...acc, [s.id]: 'None' }), {})
  });

  const updateForm = (key, value) => setFormData(f => ({ ...f, [key]: value }));
  const updateSymptom = (id, value) => setFormData(f => ({
    ...f,
    symptoms: { ...f.symptoms, [id]: value }
  }));

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Navigate to results or processing page, passing data
    navigate('/sensor', { state: { questionnaire: formData } });
  };

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => step > 1 ? handleBack() : navigate('/')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Health Assessment</h1>
          <p className="text-xs text-gray-500">Step {step} of 3</p>
        </div>
      </div>

      <div className="w-full bg-gray-200 h-2 rounded-full mb-8 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
          className="h-full bg-gray-900 rounded-full"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-lg font-semibold mb-4">Section 1: Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input 
                  type="number" 
                  required
                  value={formData.age}
                  onChange={e => updateForm('age', e.target.value)}
                  className="input-field" 
                  placeholder="e.g. 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={e => updateForm('gender', e.target.value)}
                  className="input-field bg-white"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical History / Allergies</label>
                <textarea 
                  rows="3" 
                  value={formData.history}
                  onChange={e => updateForm('history', e.target.value)}
                  className="input-field resize-none" 
                  placeholder="List any pre-existing conditions..."
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-lg font-semibold mb-4">Section 2: Primary Complaint</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Fever Duration</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '< 1 day', val: '0' },
                  { label: '1 - 3 days', val: '2' },
                  { label: '4 - 7 days', val: '5' },
                  { label: '7+ days', val: '8' }
                ].map(opt => (
                  <div 
                    key={opt.val}
                    onClick={() => updateForm('fever_duration', opt.val)}
                    className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                      formData.fever_duration === opt.val 
                      ? 'bg-gray-100 border-gray-900 text-gray-900 font-semibold' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-900'
                    }`}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-lg font-semibold mb-4">Section 3: Symptoms</h2>
            <p className="text-sm text-gray-500 mb-4">Rate the severity of each symptom</p>
            <div className="space-y-4">
              {SYMPTOMS.map(sym => (
                <div key={sym.id} className="card p-4">
                  <label className="block text-sm font-medium text-gray-900 mb-3">{sym.label}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['None', 'Mild', 'Moderate', 'Severe'].map(level => (
                      <div 
                        key={level}
                        onClick={() => updateSymptom(sym.id, level)}
                        className={`py-2 text-xs text-center rounded-lg cursor-pointer transition-colors ${
                          formData.symptoms[sym.id] === level
                          ? (level === 'None' ? 'bg-gray-200 text-gray-800' : 
                             level === 'Mild' ? 'bg-yellow-100 text-yellow-800' : 
                             level === 'Moderate' ? 'bg-orange-100 text-orange-800' : 
                             'bg-red-100 text-red-800')
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {level}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="pt-6 border-t border-gray-100 mt-8 flex gap-4">
          {step < 3 ? (
            <button type="button" onClick={handleNext} className="btn-primary w-full bg-gray-900 hover:bg-black text-white">
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button type="submit" className="btn-primary w-full bg-gray-900 hover:bg-black text-white">
              Fetch Sensor Data <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

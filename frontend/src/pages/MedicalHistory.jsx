import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const SECTIONS = [
  { field: 'conditions', label: 'Does the patient have any existing medical conditions?', placeholder: 'e.g. Type 2 Diabetes, Asthma, Hypertension, Thyroid disorder, Previous dengue or malaria...', rows: 4 },
  { field: 'allergies', label: 'Does the patient have any known allergies?', placeholder: 'e.g. Penicillin allergy, Sulfa drugs, Dust allergy, Food allergies...', rows: 3 },
  { field: 'current_medications', label: 'Is the patient currently taking any medications?', placeholder: 'e.g. Metformin 500mg twice daily, Salbutamol inhaler, Paracetamol as needed...', rows: 3 },
  { field: 'past_surgeries', label: 'Has the patient had any past surgeries or hospitalizations?', placeholder: 'e.g. Appendectomy 2019, Hospitalized for dengue fever 2022...', rows: 3 },
  { field: 'family_history', label: 'Does the patient have any relevant family medical history?', placeholder: 'e.g. Father has Type 2 Diabetes, Mother has hypertension...', rows: 3 },
  { field: 'notes', label: "Anything else you'd like us to know about the patient?", placeholder: "e.g. The patient is pregnant, recently donated blood, is immunocompromised...", rows: 3 },
];

export default function MedicalHistory() {
  const navigate = useNavigate();
  const { state } = useLocation();
  
  const [formData, setFormData] = useState(
    state?.medicalHistory || SECTIONS.reduce((acc, s) => ({ ...acc, [s.field]: '' }), {})
  );

  const update = (field, value) => setFormData(f => ({ ...f, [field]: value }));

  const handleContinue = () => {
    navigate('/scan/questionnaire', { state: { medicalHistory: formData } });
  };

  const fillDemoData = (type) => {
    let mockProfile = {};
    const baseSymptoms = {
      headache: 0, cough: 0, vomiting: 0, myalgia: 0, rash: 0,
      rigors: 0, sweating: 0, petechiae: 0, retroorbital_pain: 0,
      cyclical_fever: 0, dark_urine: 0, stomach_pain: 0,
      bleeding_tendency: 0, diarrhea: 0, ear_pain: 0
    };

    if (type === 'dengue') {
      mockProfile = {
        medicalHistory: { conditions: 'None', allergies: 'None', current_medications: 'Paracetamol', past_surgeries: 'None', family_history: 'None', notes: '' },
        questionnaire: {
          age: '28', gender: 'Male', fever_duration: 3, travel_history: 1, recent_vaccination: false,
          unusually_drowsy: false, struggling_to_breathe: false, severe_dehydration: false, seizures: false, stiff_neck: false,
          symptoms: { ...baseSymptoms, headache: 3, myalgia: 3, retroorbital_pain: 3, petechiae: 2, rash: 1 }
        },
        vitals: { temperature_c: 39.5, heart_rate: 115, spo2: 97, humidity: 65.0 },
        geoContext: { ambient_temp_c: 32.5, location_zone: 'tropical', city: 'Bengaluru', status: 'success' }
      };
    } else if (type === 'malaria') {
      mockProfile = {
        medicalHistory: { conditions: 'None', allergies: 'None', current_medications: 'None', past_surgeries: 'None', family_history: 'None', notes: 'Just returned from a rural trip' },
        questionnaire: {
          age: '35', gender: 'Female', fever_duration: 4, travel_history: 2, recent_vaccination: false,
          unusually_drowsy: false, struggling_to_breathe: false, severe_dehydration: false, seizures: false, stiff_neck: false,
          symptoms: { ...baseSymptoms, rigors: 3, cyclical_fever: 3, sweating: 3, dark_urine: 2, headache: 2 }
        },
        vitals: { temperature_c: 40.1, heart_rate: 125, spo2: 98, humidity: 80.0 },
        geoContext: { ambient_temp_c: 30.0, location_zone: 'tropical', city: 'Mumbai', status: 'success' }
      };
    } else if (type === 'viral_child') {
      mockProfile = {
        medicalHistory: { conditions: 'None', allergies: 'None', current_medications: 'None', past_surgeries: 'None', family_history: 'None', notes: 'Had routine vaccines yesterday' },
        questionnaire: {
          age: '2', gender: 'Male', fever_duration: 1, travel_history: 0, recent_vaccination: true,
          unusually_drowsy: false, struggling_to_breathe: false, severe_dehydration: false, seizures: false, stiff_neck: false,
          symptoms: { ...baseSymptoms, cough: 1, vomiting: 1 }
        },
        vitals: { temperature_c: 38.2, heart_rate: 130, spo2: 99, humidity: 45.0 },
        geoContext: { ambient_temp_c: 22.0, location_zone: 'temperate', city: 'London', status: 'success' }
      };
    }
    
    navigate('/analyzing', { state: mockProfile });
  };


  return (
    <div className="pb-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="p-2.5 bg-white rounded-xl shadow-sm border" style={{ borderColor: '#E2E8F0' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Medical History</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Step 1 of 4 · This helps us understand the patient's health background (All questions are optional)</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto mb-4 no-scrollbar">
        <button onClick={() => fillDemoData('dengue')} className="shrink-0 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200">Demo: Dengue</button>
        <button onClick={() => fillDemoData('malaria')} className="shrink-0 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border border-amber-200">Demo: Malaria</button>
        <button onClick={() => fillDemoData('viral_child')} className="shrink-0 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">Demo: Viral (Child)</button>
      </div>

      <div className="step-progress mb-8">
        <div className="step-progress-fill" style={{ width: '25%' }} />
      </div>

      <div className="space-y-5">
        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.field}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card"
          >
            <label className="block text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>{section.label}</label>
            <textarea
              rows={section.rows}
              value={formData[section.field]}
              onChange={e => update(section.field, e.target.value)}
              className="input-field resize-none"
              placeholder={section.placeholder}
            />
          </motion.div>
        ))}
      </div>

      <p className="text-xs mt-6 mb-4" style={{ color: '#94A3B8' }}>
        ℹ️ Medical history is stored securely and is NOT directly used in ML prediction. It helps generate more accurate health insights.
      </p>

      <button onClick={handleContinue} className="btn-primary">
        Continue to Symptoms <ChevronRight size={18} />
      </button>
    </div>
  );
}

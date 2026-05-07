import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const SECTIONS = [
  { field: 'conditions', label: 'Do you have any existing medical conditions?', placeholder: 'e.g. Type 2 Diabetes, Asthma, Hypertension, Thyroid disorder, Previous dengue or malaria...', rows: 4 },
  { field: 'allergies', label: 'Any known allergies?', placeholder: 'e.g. Penicillin allergy, Sulfa drugs, Dust allergy, Food allergies...', rows: 3 },
  { field: 'current_medications', label: 'Are you currently taking any medications?', placeholder: 'e.g. Metformin 500mg twice daily, Salbutamol inhaler, Paracetamol as needed...', rows: 3 },
  { field: 'past_surgeries', label: 'Any past surgeries or hospitalizations?', placeholder: 'e.g. Appendectomy 2019, Hospitalized for dengue fever 2022...', rows: 3 },
  { field: 'family_history', label: 'Any relevant family medical history?', placeholder: 'e.g. Father has Type 2 Diabetes, Mother has hypertension...', rows: 3 },
  { field: 'notes', label: "Anything else you'd like us to know?", placeholder: "e.g. I'm pregnant, I recently donated blood, I'm immunocompromised...", rows: 3 },
];

export default function MedicalHistory() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(
    SECTIONS.reduce((acc, s) => ({ ...acc, [s.field]: '' }), {})
  );

  const update = (field, value) => setFormData(f => ({ ...f, [field]: value }));

  const handleContinue = () => {
    navigate('/scan/questionnaire', { state: { medicalHistory: formData } });
  };

  return (
    <div className="pb-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="p-2.5 bg-white rounded-xl shadow-sm border" style={{ borderColor: '#E2E8F0' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Medical History</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Step 1 of 4 · This helps us understand your health background</p>
        </div>
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

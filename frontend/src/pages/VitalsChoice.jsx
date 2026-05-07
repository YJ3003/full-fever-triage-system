import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Camera, Keyboard, ArrowLeft } from 'lucide-react';

export default function VitalsChoice() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const questionnaire = state?.questionnaire;

  return (
    <div className="pb-20">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all border border-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vitals Entry</h1>
            <p className="text-sm text-gray-500 font-medium">Choose how to input vitals</p>
          </div>
        </div>

        <div className="space-y-4">
          <div 
            onClick={() => navigate('/sensor', { state: { questionnaire } })}
            className="card p-6 flex items-center gap-5 cursor-pointer hover:border-[#064E3B] hover:shadow-md group transition-all"
          >
            <div className="w-14 h-14 bg-[#F9FAFB] rounded-2xl flex items-center justify-center group-hover:bg-[#064E3B] transition-colors">
              <Activity className="w-6 h-6 text-gray-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Auto-fetch Sensors</h3>
              <p className="text-sm text-gray-500 leading-tight">Connect to NIDAN ESP32 hardware device</p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/camera-ppg', { state: { questionnaire } })}
            className="card p-6 flex items-center gap-5 cursor-pointer hover:border-[#064E3B] hover:shadow-md group transition-all"
          >
            <div className="w-14 h-14 bg-[#F9FAFB] rounded-2xl flex items-center justify-center group-hover:bg-[#064E3B] transition-colors">
              <Camera className="w-6 h-6 text-gray-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Camera PPG (Optional)</h3>
              <p className="text-sm text-gray-500 leading-tight">Measure HR & SpO2 using your phone camera</p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/manual-vitals', { state: { questionnaire } })}
            className="card p-6 flex items-center gap-5 cursor-pointer hover:border-[#064E3B] hover:shadow-md group transition-all"
          >
            <div className="w-14 h-14 bg-[#F9FAFB] rounded-2xl flex items-center justify-center group-hover:bg-[#064E3B] transition-colors">
              <Keyboard className="w-6 h-6 text-gray-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Manual Entry</h3>
              <p className="text-sm text-gray-500 leading-tight">Type in your vital signs manually</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

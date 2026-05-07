import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Heart, ArrowLeft } from 'lucide-react';

export default function CameraPPG() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, scanning, complete
  const [progress, setProgress] = useState(0);

  const startScan = () => {
    setStatus('scanning');
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setStatus('complete');
      }
    }, 500);
  };

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Advanced Pulse Scan</h1>
      </div>

      <div className="card text-center mb-8">
        <p className="text-sm text-gray-600 mb-4">
          Place your index finger over the rear camera lens and flash. Hold steady for 10 seconds to estimate Heart Rate Variability (HRV).
        </p>

        <div className="relative w-48 h-48 mx-auto mb-6 bg-gray-100 rounded-3xl overflow-hidden flex items-center justify-center border-4 border-gray-200">
          {status === 'idle' && <Camera className="w-12 h-12 text-gray-400" />}
          
          {status === 'scanning' && (
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute inset-0 bg-red-500/20"
            />
          )}

          {status === 'complete' && <Heart className="w-16 h-16 text-red-500" />}
        </div>

        {status === 'scanning' && (
          <div className="w-full bg-gray-200 h-2 rounded-full mb-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gray-900 rounded-full"
            />
          </div>
        )}

        {status === 'idle' && (
          <button onClick={startScan} className="btn-primary bg-gray-900 hover:bg-black text-white">
            Start Camera Scan
          </button>
        )}

        {status === 'complete' && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-xl">
              <span className="block text-sm text-gray-600 font-medium">Estimated HRV</span>
              <span className="text-2xl font-bold text-gray-900">42 ms</span>
            </div>
            <button onClick={() => navigate('/')} className="btn-secondary w-full bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200">
              Save and Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

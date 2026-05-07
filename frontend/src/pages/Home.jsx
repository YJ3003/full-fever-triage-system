import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Thermometer, Droplets, Wind, AlertTriangle, ArrowRight, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const VitalsCard = ({ title, value, unit, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="card flex flex-col items-start gap-4 hover:shadow-md"
  >
    <div className={`p-3 rounded-xl bg-opacity-10 ${color.bg} ${color.text}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-sm font-medium text-gray-500">{unit}</span>
      </div>
    </div>
  </motion.div>
);

export default function Home() {
  const navigate = useNavigate();
  // Simulate live data
  const [vitals, setVitals] = useState({
    temp: 98.6,
    spo2: 98,
    hr: 75,
    humidity: 45
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(v => ({
        temp: +(v.temp + (Math.random() - 0.5) * 0.2).toFixed(1),
        spo2: Math.min(100, Math.max(90, v.spo2 + Math.floor((Math.random() - 0.5) * 2))),
        hr: Math.min(120, Math.max(60, v.hr + Math.floor((Math.random() - 0.5) * 4))),
        humidity: +(v.humidity + (Math.random() - 0.5)).toFixed(1)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, Yug</h1>
          <p className="text-gray-500 text-sm">Here is your live health overview.</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=Yug+Jain&background=F3F4F6&color=000000" alt="Profile" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <VitalsCard 
          title="Body Temp" 
          value={vitals.temp} 
          unit="°F" 
          icon={Thermometer} 
          color={{ bg: 'bg-gray-100', text: 'text-gray-900' }} 
          delay={0.1} 
        />
        <VitalsCard 
          title="Oxygen SpO2" 
          value={vitals.spo2} 
          unit="%" 
          icon={Wind} 
          color={{ bg: 'bg-gray-100', text: 'text-gray-900' }} 
          delay={0.2} 
        />
        <VitalsCard 
          title="Heart Rate" 
          value={vitals.hr} 
          unit="bpm" 
          icon={Heart} 
          color={{ bg: 'bg-gray-100', text: 'text-gray-900' }} 
          delay={0.3} 
        />
        <VitalsCard 
          title="Environment" 
          value={vitals.humidity} 
          unit="% RH" 
          icon={Droplets} 
          color={{ bg: 'bg-gray-100', text: 'text-gray-900' }} 
          delay={0.4} 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="card bg-gray-900 text-white border-none relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 right-10 w-24 h-24 bg-white opacity-10 rounded-full -mb-8"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" /> Current Status
            </h3>
            <p className="text-gray-400 text-sm mt-1">Monitoring active</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
            <span className="font-bold">Stable</span>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4 pt-4">
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        
        <button 
          onClick={() => navigate('/questionnaire')}
          className="w-full card flex items-center justify-between hover:border-medical-teal cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 group-hover:bg-gray-900 group-hover:text-white transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">New Triage Assessment</h4>
              <p className="text-xs text-gray-500">Log symptoms and get AI analysis</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-medical-blue transition-colors" />
        </button>

        <button 
          onClick={() => navigate('/camera-ppg')}
          className="w-full card flex items-center justify-between hover:border-medical-teal cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 group-hover:bg-gray-900 group-hover:text-white transition-colors">
              <Heart className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Camera PPG Scan</h4>
              <p className="text-xs text-gray-500">Measure heart rate variability</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
        </button>
      </div>
    </div>
  );
}

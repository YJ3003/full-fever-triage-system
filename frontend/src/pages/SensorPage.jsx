import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Wifi, CheckCircle2, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function SensorPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('connecting'); // connecting, fetching, analyzing, done, error
  const [sensorData, setSensorData] = useState(null);

  useEffect(() => {
    if (!state?.questionnaire) {
      navigate('/questionnaire');
      return;
    }

    const fetchESP32 = async () => {
      // Mock ESP32 connection delay
      setTimeout(() => setStatus('fetching'), 1500);
      
      // Mock ESP32 reading
      setTimeout(() => {
        const mockData = {
          temperature_c: +(37.5 + Math.random() * 2).toFixed(1),
          heart_rate: Math.floor(80 + Math.random() * 30),
          spo2: Math.floor(92 + Math.random() * 7),
          humidity: 45.0,
          hrv: +(20 + Math.random() * 10).toFixed(1)
        };
        setSensorData(mockData);
        setStatus('analyzing');
        submitToAPI(mockData, state.questionnaire);
      }, 4000);
    };

    fetchESP32();
  }, [state, navigate]);

  const submitToAPI = async (sensors, qData) => {
    try {
      // Map symptoms to 0/1
      const symptomFlags = {};
      Object.keys(qData.symptoms).forEach(key => {
        symptomFlags[key] = qData.symptoms[key] !== 'None' ? 1 : 0;
      });

      const payload = {
        temperature_c: sensors.temperature_c,
        heart_rate: sensors.heart_rate,
        spo2: sensors.spo2,
        hrv: sensors.hrv,
        humidity: sensors.humidity,
        age: parseInt(qData.age) || 30,
        fever_days: parseInt(qData.fever_duration) || 0,
        ...symptomFlags
      };

      const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/predict`, payload);
      
      setTimeout(() => {
        setStatus('done');
        navigate('/results', { state: { result: response.data, sensors, questionnaire: qData } });
      }, 1500);

    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-8 relative"
      >
        <div className="absolute inset-0 border-4 border-gray-900 border-t-transparent rounded-full animate-spin opacity-50"></div>
        {status === 'connecting' && <Wifi className="w-10 h-10 text-gray-900" />}
        {status === 'fetching' && <Activity className="w-10 h-10 text-gray-900 animate-pulse" />}
        {status === 'analyzing' && <Activity className="w-10 h-10 text-black" />}
        {status === 'done' && <CheckCircle2 className="w-10 h-10 text-gray-900" />}
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {status === 'connecting' && "Connecting to Device..."}
        {status === 'fetching' && "Reading Vitals..."}
        {status === 'analyzing' && "AI Analysis in Progress..."}
        {status === 'done' && "Complete!"}
        {status === 'error' && "Connection Failed"}
      </h2>
      
      <p className="text-gray-500 max-w-[250px]">
        {status === 'connecting' && "Searching for paired NIDAN-AI sensor hardware via WiFi."}
        {status === 'fetching' && "Keep your finger steady on the MAX30102 sensor."}
        {status === 'analyzing' && "Running clinical risk models and generating insights."}
        {status === 'error' && "Make sure your ESP32 device is powered on and connected to the same network."}
      </p>

      {status === 'error' && (
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 btn-primary max-w-[200px]"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
}

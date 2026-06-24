import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Thermometer, Droplets, Wind, Activity, Wifi, CheckCircle, AlertTriangle, Keyboard, Radio, MapPin } from 'lucide-react';

const getTemperatureColor = (val, age, unit = 'C') => {
  let v = parseFloat(val);
  if (isNaN(v) || v === 0) return '#94A3B8';
  if (unit === 'F') v = (v - 32) * 5 / 9; // convert to C for logic
  const a = parseInt(age) || 30;
  if (v < 35 || v > 43) return '#DC2626'; // extreme/invalid
  
  const normalMax = a <= 3 ? 37.5 : 37.2;
  const borderlineMax = a <= 3 ? 38.3 : 38.0;
  
  if (v <= normalMax && v >= 36.1) return '#16A34A';
  if (v <= borderlineMax) return '#D97706';
  return '#DC2626';
};

const getSpo2Color = (val) => {
  const v = parseInt(val);
  if (isNaN(v) || v === 0) return '#94A3B8';
  if (v < 70 || v > 100) return '#DC2626'; // extreme/invalid
  if (v >= 95) return '#16A34A';
  if (v >= 90) return '#D97706';
  return '#DC2626';
};

const getHRColor = (val, age) => {
  const v = parseInt(val);
  const a = parseInt(age) || 30;
  if (isNaN(v) || v === 0) return '#94A3B8';
  if (v < 30 || v > 220) return '#DC2626'; // extreme/invalid
  
  let normalMin = 60, normalMax = 100, high = 130;
  if (a <= 2) { normalMin = 100; normalMax = 160; high = 180; }
  else if (a <= 10) { normalMin = 70; normalMax = 120; high = 140; }
  
  if (v >= normalMin && v <= normalMax) return '#16A34A';
  if (v > high || v < normalMin - 10) return '#DC2626';
  return '#D97706';
};

const getHRRangeText = (age) => {
  const a = parseInt(age) || 30;
  if (a <= 2) return '100–160 bpm normal';
  if (a <= 10) return '70–120 bpm normal';
  return '60–100 bpm normal';
};

const getTempRangeText = (age, unit = 'C') => {
  const a = parseInt(age) || 30;
  const maxC = a <= 3 ? 37.5 : 37.2;
  if (unit === 'F') {
    return `97.0–${(maxC * 9/5 + 32).toFixed(1)}°F normal`;
  }
  return `36.1–${maxC}°C normal`;
};

export default function HardwarePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const medicalHistory = state?.medicalHistory || {};
  const questionnaire = state?.questionnaire || {};

  const [activeTab, setActiveTab] = useState('manual'); // 'fetch' | 'manual'
  const [fetchStatus, setFetchStatus] = useState('idle'); // idle | connecting | success | error
  const [loadingMessage, setLoadingMessage] = useState('Connecting to device...');
  const [tempUnit, setTempUnit] = useState('C');
  const [vitals, setVitals] = useState({
    temperature: '',
    spo2: '',
    humidity: '50',
    heart_rate: '',
  });

  const [geoContext, setGeoContext] = useState({
    ambient_temp_c: null,
    location_zone: 'temperate',
    city: '',
    status: 'idle'
  });

  useEffect(() => {
    const fetchGeo = async () => {
      setGeoContext(prev => ({ ...prev, status: 'fetching' }));
      try {
        // Fallback chain for IP Geolocation to bypass adblockers
        let lat, lng, city;
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          if (data.error) throw new Error("ipapi error");
          lat = parseFloat(data.latitude);
          lng = parseFloat(data.longitude);
          city = data.city;
        } catch (e1) {
          try {
            const res2 = await fetch('https://ipwho.is/');
            const data2 = await res2.json();
            if (!data2.success) throw new Error("ipwhois error");
            lat = parseFloat(data2.latitude);
            lng = parseFloat(data2.longitude);
            city = data2.city;
          } catch (e2) {
            const res3 = await fetch('https://get.geojs.io/v1/ip/geo.json');
            const data3 = await res3.json();
            lat = parseFloat(data3.latitude);
            lng = parseFloat(data3.longitude);
            city = data3.city;
          }
        }
        city = city || 'your region';
        
        const absLat = Math.abs(lat);
        let zone = 'temperate';
        if (absLat <= 23.5) zone = 'tropical';
        else if (absLat <= 35) zone = 'subtropical';
        else if (absLat <= 60) zone = 'temperate';
        else zone = 'arid';
        
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m`);
        const data = await res.json();
        
        setGeoContext({
          ambient_temp_c: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          location_zone: zone,
          city: city,
          status: 'success'
        });
        setVitals(v => ({ ...v, humidity: data.current.relative_humidity_2m?.toString() || '50' }));
      } catch (err) {
        setGeoContext(prev => ({ ...prev, status: 'error' }));
      }
    };
    fetchGeo();
  }, []);

  const updateVital = (key, val) => setVitals(v => ({ ...v, [key]: val }));

  const toggleTempUnit = () => {
    if (!vitals.temperature) {
      setTempUnit(prev => prev === 'C' ? 'F' : 'C');
      return;
    }
    let currentTemp = parseFloat(vitals.temperature);
    if (tempUnit === 'C') {
      setVitals(v => ({ ...v, temperature: ((currentTemp * 9/5) + 32).toFixed(1) }));
      setTempUnit('F');
    } else {
      setVitals(v => ({ ...v, temperature: ((currentTemp - 32) * 5/9).toFixed(1) }));
      setTempUnit('C');
    }
  };

  const handleFetch = async () => {
    setFetchStatus('connecting');
    setLoadingMessage('Connecting to NIDAN-AI device...');
    
    const msgs = [
      "Calibrating IR & Red sensors...",
      "Please place your finger gently on the sensor...",
      "Please keep your hand still...",
      "Reading SpO2 and Heart Rate...",
      "Analyzing body temperature...",
      "Finalizing vitals..."
    ];
    let step = 0;
    const msgInterval = setInterval(() => {
      if (step < msgs.length) {
        setLoadingMessage(msgs[step]);
        step++;
      }
    }, 1000);

    // Enforce minimum 4.5 seconds delay for engagement
    const minWait = new Promise(resolve => setTimeout(resolve, 4500));

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
      const fetchPromise = fetch(`${BACKEND_URL}/sensors/latest`, { signal: AbortSignal.timeout(8000) })
        .then(async (response) => {
          if (!response.ok) throw new Error('Data stale or device not connected');
          return response.json();
        });

      // Wait for both the artificial delay and the actual fetch
      const [data] = await Promise.all([fetchPromise, minWait]);
      
      clearInterval(msgInterval);
      setTempUnit('C');
      setVitals(v => ({
        ...v,
        temperature: data.temperature_c?.toString() || '',
        spo2: data.spo2?.toString() || '',
        heart_rate: data.heart_rate?.toString() || '',
      }));
      setFetchStatus('success');
    } catch {
      clearInterval(msgInterval);
      setFetchStatus('error');
      setTimeout(() => setActiveTab('manual'), 2000);
    }
  };

  const handleContinue = () => {
    let finalTempC = parseFloat(vitals.temperature);
    if (tempUnit === 'F') finalTempC = (finalTempC - 32) * 5 / 9;
    finalTempC = parseFloat(finalTempC.toFixed(1));
    
    navigate('/analyzing', {
      state: {
        medicalHistory,
        questionnaire,
        vitals: {
          temperature_c: finalTempC,
          heart_rate: parseInt(vitals.heart_rate),
          spo2: parseInt(vitals.spo2),
          humidity: parseFloat(vitals.humidity) || 50,
          ambient_temp_c: geoContext.ambient_temp_c,
          location_zone: geoContext.city ? `${geoContext.location_zone} (${geoContext.city})` : geoContext.location_zone,
        },
        hardware_source: activeTab === 'fetch' ? 'esp32' : 'manual',
      }
    });
  };

  const isValid = (() => {
    let temp = parseFloat(vitals.temperature);
    if (tempUnit === 'F') temp = (temp - 32) * 5 / 9;
    const hr = parseInt(vitals.heart_rate);
    const sp = parseInt(vitals.spo2);
    return temp >= 35 && temp <= 43 && hr >= 30 && hr <= 220 && sp >= 70 && sp <= 100;
  })();

  return (
    <div className="pb-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/scan/symptoms', { state: { medicalHistory, questionnaire } })} className="p-2.5 bg-white rounded-xl shadow-sm border" style={{ borderColor: '#E2E8F0' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Physiological Data</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Step 4 of 4 · Collect your vital signs</p>
        </div>
      </div>

      {geoContext.status === 'success' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl flex items-center gap-3" style={{ background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#DBEAFE' }}>
            <MapPin size={16} color="#2563EB" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: '#1E3A8A' }}>Geo-Aware Calibration Active</p>
            <p className="text-[11px]" style={{ color: '#1D4ED8' }}>Adjusting baseline for {geoContext.city} ({geoContext.location_zone} climate, {geoContext.ambient_temp_c}°C ambient)</p>
          </div>
        </motion.div>
      )}
      
      {geoContext.status === 'error' && (
        <div className="mb-6 p-3 rounded-xl flex items-center gap-3 bg-gray-50 border border-gray-200">
          <MapPin size={16} className="text-gray-400" />
          <p className="text-xs text-gray-500">Could not detect location. Using standard global fever thresholds.</p>
        </div>
      )}

      {geoContext.status === 'fetching' && (
        <div className="mb-6 p-3 rounded-xl flex items-center gap-3 bg-gray-50 border border-gray-200">
          <div className="w-4 h-4 border-2 rounded-full animate-spin border-gray-300 border-t-gray-600" />
          <p className="text-xs text-gray-500">Detecting local climate...</p>
        </div>
      )}

      <div className="step-progress mb-8">
        <div className="step-progress-fill" style={{ width: '100%' }} />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('fetch')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'fetch' ? 'text-white shadow-md' : 'bg-white border text-gray-600'
          }`}
          style={activeTab === 'fetch' ? { background: '#064E3B' } : { borderColor: '#E2E8F0' }}
        >
          <Radio size={16} /> Fetch from Device
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'manual' ? 'text-white shadow-md' : 'bg-white border text-gray-600'
          }`}
          style={activeTab === 'manual' ? { background: '#064E3B' } : { borderColor: '#E2E8F0' }}
        >
          <Keyboard size={16} /> Manual Entry
        </button>
      </div>

      {activeTab === 'fetch' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {fetchStatus === 'idle' && (
            <div className="card text-center py-10">
              <Wifi size={48} color="#064E3B" className="mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>Connect & Fetch Data</h3>
              <p className="text-sm mb-6" style={{ color: '#64748B' }}>Pull sensor readings from your NIDAN-AI ESP32 device</p>
              <button onClick={handleFetch} className="btn-primary">Fetch Sensor Data</button>
            </div>
          )}
          {fetchStatus === 'connecting' && (
            <div className="card text-center py-10">
              <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#E2E8F0', borderTopColor: '#064E3B' }} />
              <p className="font-medium" style={{ color: '#0F172A' }}>{loadingMessage}</p>
            </div>
          )}
          {fetchStatus === 'success' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={20} color="#16A34A" />
                <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Data received successfully</span>
              </div>
              {[
                { label: 'Body Temperature', value: vitals.temperature, unit: '°C', icon: Thermometer, color: getTemperatureColor(vitals.temperature, questionnaire.age, 'C') },
                { label: 'Blood Oxygen (SpO2)', value: vitals.spo2, unit: '%', icon: Droplets, color: getSpo2Color(vitals.spo2) },
                { label: 'Ambient Humidity', value: vitals.humidity, unit: '%', icon: Wind, color: '#64748B' },
                { label: 'Heart Rate', value: vitals.heart_rate, unit: 'bpm', icon: Activity, color: getHRColor(vitals.heart_rate, questionnaire.age) },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
                    <item.icon size={20} color={item.color} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: '#64748B' }}>{item.label}</p>
                    <p className="text-xl font-bold" style={{ color: '#0F172A' }}>{item.value} <span className="text-sm font-normal" style={{ color: '#94A3B8' }}>{item.unit}</span></p>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                </motion.div>
              ))}
            </div>
          )}
          {fetchStatus === 'error' && (
            <div className="card text-center py-8">
              <AlertTriangle size={40} color="#DC2626" className="mx-auto mb-3" />
              <p className="font-bold mb-1" style={{ color: '#DC2626' }}>Could not connect</p>
              <p className="text-sm mb-4" style={{ color: '#64748B' }}>Switching to manual entry...</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'manual' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {[
            { key: 'temperature', label: 'Body Temperature', unit: `°${tempUnit}`, placeholder: tempUnit === 'C' ? 'e.g. 38.5' : 'e.g. 101.3', step: '0.1', range: getTempRangeText(questionnaire.age, tempUnit), color: getTemperatureColor(vitals.temperature, questionnaire.age, tempUnit), icon: Thermometer },
            { key: 'spo2', label: 'Blood Oxygen (SpO2)', unit: '%', placeholder: 'e.g. 97', step: '1', range: '95–100% normal', color: getSpo2Color(vitals.spo2), icon: Droplets },
            { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', placeholder: 'e.g. 85', step: '1', range: getHRRangeText(questionnaire.age), color: getHRColor(vitals.heart_rate, questionnaire.age), icon: Activity },
          ].map((field, i) => (
            <motion.div key={field.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${field.color}15` }}>
                  <field.icon size={16} color={field.color} />
                </div>
                <div>
                  <label className="block text-sm font-semibold" style={{ color: '#0F172A' }}>{field.label}</label>
                  <span className="text-xs" style={{ color: '#94A3B8' }}>{field.range}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={field.step}
                  value={vitals[field.key]}
                  onChange={e => updateVital(field.key, e.target.value)}
                  className="input-field flex-1"
                  placeholder={field.placeholder}
                />
                {field.key === 'temperature' ? (
                  <button onClick={toggleTempUnit} className="text-sm font-bold px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100" style={{ color: '#0F172A' }}>
                    °{tempUnit} ⇄
                  </button>
                ) : (
                  <span className="text-sm font-medium px-3" style={{ color: '#64748B' }}>{field.unit}</span>
                )}
              </div>
              {vitals[field.key] && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: field.color }} />
                  <span className="text-xs font-medium" style={{ color: field.color }}>
                    {field.color === '#16A34A' ? 'Normal range' : field.color === '#D97706' ? 'Borderline' : field.color === '#DC2626' ? 'Abnormal' : ''}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={!isValid && fetchStatus !== 'success'}
          className="btn-primary"
        >
          Analyze Data <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

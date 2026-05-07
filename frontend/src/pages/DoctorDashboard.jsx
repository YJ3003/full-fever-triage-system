import { useState } from 'react';
import { Users, Search, Filter, ChevronRight, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_PATIENTS = [
  { id: 1, name: 'Rahul Sharma', age: 34, risk: 'High', temp: 102.1, spo2: 95, time: '10 min ago' },
  { id: 2, name: 'Priya Patel', age: 28, risk: 'Moderate', temp: 99.8, spo2: 98, time: '1 hour ago' },
  { id: 3, name: 'Amit Singh', age: 45, risk: 'Critical', temp: 103.5, spo2: 89, time: '2 hours ago' },
  { id: 4, name: 'Neha Gupta', age: 31, risk: 'Low', temp: 98.6, spo2: 99, time: '5 hours ago' }
];

export default function DoctorDashboard() {
  const [searchTerm, setSearchTerm] = useState('');

  const riskColors = {
    'Low': 'bg-green-100 text-green-800',
    'Moderate': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-orange-100 text-orange-800',
    'Critical': 'bg-red-100 text-red-800 font-bold border border-red-200'
  };

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Physician Portal</h1>
          <p className="text-gray-500 text-sm">Overview of recent patient triages</p>
        </div>
        <div className="w-10 h-10 bg-medical-dark rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">Dr</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card bg-gray-900 text-white border-none p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-medium">Total Cases</p>
              <h2 className="text-2xl font-bold mt-1">124</h2>
            </div>
            <Users className="w-6 h-6 opacity-50" />
          </div>
        </div>
        <div className="card bg-red-500 text-white border-none p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-100 text-xs font-medium">Critical Alerts</p>
              <h2 className="text-2xl font-bold mt-1">3</h2>
            </div>
            <AlertTriangle className="w-6 h-6 opacity-50" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search patients..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
          <Filter className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm mb-2">Recent Triages</h3>
        {MOCK_PATIENTS.map((patient, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={patient.id} 
            className="card p-4 hover:border-gray-900 cursor-pointer flex items-center justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                <span className="text-xs text-gray-500">({patient.age}y)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-red-500"/> {patient.temp}°F</span>
                <span>SpO2: {patient.spo2}%</span>
                <span>• {patient.time}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-md text-xs ${riskColors[patient.risk]}`}>
                {patient.risk}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

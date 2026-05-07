import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Navigation, AlertCircle, ArrowLeft, Loader2, Hospital } from 'lucide-react';

const FEVER_TYPE_SEARCH = {
  'Dengue-like': 'fever clinic dengue hospital',
  'Malaria-like': 'malaria clinic hospital',
  'Typhoid-like': 'fever hospital',
  'Viral': 'general physician clinic',
  'Bacterial': 'general hospital',
  'Unknown': 'general physician near me',
};

export default function NearbyDoctors() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [status, setStatus] = useState('locating'); // locating | loading | ready | error
  const [errorMsg, setErrorMsg] = useState('');

  const feverPattern = state?.result?.infection_pattern || 'Unknown';
  const searchQuery = FEVER_TYPE_SEARCH[feverPattern] || 'general physician near me';

  useEffect(() => {
    let map;
    let geoWatchId;

    const initMap = (lat, lng) => {
      setStatus('loading');
      const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!MAPS_KEY || MAPS_KEY === 'YOUR_MAPS_KEY_HERE') {
        setStatus('error');
        setErrorMsg('Google Maps API key not configured. Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env');
        return;
      }

      // Load Maps JS SDK dynamically
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&callback=__nidanMapInit`;
        script.async = true;
        script.defer = true;
        window.__nidanMapInit = () => renderMap(lat, lng, MAPS_KEY);
        document.head.appendChild(script);
      } else {
        renderMap(lat, lng, MAPS_KEY);
      }
    };

    const renderMap = (lat, lng, key) => {
      if (!mapRef.current) return;
      const center = { lat, lng };
      map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi.business', stylers: [{ visibility: 'simplified' }] },
          { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
        ],
      });

      // User marker
      new window.google.maps.Marker({
        position: center,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#064E3B',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        title: 'Your Location',
      });

      // Places search
      const service = new window.google.maps.places.PlacesService(map);
      service.nearbySearch(
        { location: center, radius: 5000, keyword: searchQuery },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            results.slice(0, 8).forEach(place => {
              const marker = new window.google.maps.Marker({
                position: place.geometry.location,
                map,
                icon: {
                  url: 'https://maps.google.com/mapfiles/ms/icons/hospitals.png',
                  scaledSize: new window.google.maps.Size(32, 32),
                },
                title: place.name,
              });
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="font-family:'DM Sans',sans-serif;padding:4px;max-width:200px">
                    <b style="color:#064E3B">${place.name}</b><br/>
                    <span style="color:#64748B;font-size:12px">${place.vicinity}</span>
                  </div>
                `,
              });
              marker.addListener('click', () => infoWindow.open(map, marker));
            });
            setStatus('ready');
          } else {
            setStatus('ready'); // still show map even if no results
          }
        }
      );
    };

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => initMap(coords.latitude, coords.longitude),
      (err) => {
        setStatus('error');
        setErrorMsg('Location access denied. Please enable location to find nearby doctors.');
      },
      { timeout: 10000, maximumAge: 60000 }
    );

    return () => {
      if (geoWatchId) navigator.geolocation.clearWatch(geoWatchId);
    };
  }, []);

  return (
    <div className="pb-8 space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-xl shadow-sm border" style={{ borderColor: '#E2E8F0' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Nearby Healthcare</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>
            Showing: <span className="font-medium" style={{ color: '#064E3B' }}>{feverPattern}</span> specialists
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: 380, background: '#F1F5F9' }}>
        {status === 'locating' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Navigation size={32} color="#064E3B" className="animate-pulse" />
            <p className="text-sm font-medium" style={{ color: '#64748B' }}>Getting your location...</p>
          </div>
        )}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} color="#064E3B" className="animate-spin" />
            <p className="text-sm font-medium" style={{ color: '#64748B' }}>Finding nearby clinics...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle size={40} color="#DC2626" />
            <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{errorMsg}</p>
            <div className="mt-2 p-3 rounded-xl text-xs text-left" style={{ background: '#FEF2F2', color: '#991B1B' }}>
              Add to <code>frontend/.env</code>:<br />
              <code>VITE_GOOGLE_MAPS_API_KEY=your_key</code>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Info */}
      <div className="card flex items-start gap-3" style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
        <Hospital size={20} color="#064E3B" className="shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold" style={{ color: '#064E3B' }}>Smart Search Active</p>
          <p className="text-xs mt-0.5" style={{ color: '#047857' }}>
            Based on your <strong>{feverPattern}</strong> pattern, we're showing relevant clinics and hospitals within 5km of your location.
          </p>
        </div>
      </div>
    </div>
  );
}

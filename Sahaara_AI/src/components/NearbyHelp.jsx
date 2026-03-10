import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Search, Crosshair, Map, ArrowRight } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import './NearbyHelp.css';

// Helper to calculate distance (km) between two lat/lon points
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const NearbyHelp = ({ selectedLanguage, location, condition }) => {
  const [hospitals, setHospitals] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  // Map simple condition keywords to specialty tags (very basic)
  const conditionMap = {
    chest: ['cardiology', 'heart'],
    heart: ['cardiology', 'heart'],
    bone: ['orthopedic', 'bone'],
    fracture: ['orthopedic'],
    breathing: ['emergency', 'pulmonology'],
    asthma: ['pulmonology'],
    cough: ['pulmonology']
  };

  const getSpecialties = () => {
    if (!condition) return [];
    const lower = condition.toLowerCase();
    for (const key in conditionMap) {
      if (lower.includes(key)) return conditionMap[key];
    }
    return [];
  };

  const [internalLocation, setInternalLocation] = useState(location || null);
  const activeLocation = internalLocation;

  useEffect(() => {
    if (location) setInternalLocation(location);
  }, [location]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInternalLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        console.error(err);
        alert('Unable to retrieve location');
      }
    );
  };

  // Fetch hospitals from OpenStreetMap Overpass API when location changes
  useEffect(() => {
    if (!activeLocation) return;
    const fetchHospitals = async () => {
      setLoading(true);
      const radius = 5000; // meters
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${radius},${activeLocation.lat},${activeLocation.lon});
          way["amenity"="hospital"](around:${radius},${activeLocation.lat},${activeLocation.lon});
          relation["amenity"="hospital"](around:${radius},${activeLocation.lat},${activeLocation.lon});
        );
        out center tags;`;
      try {
        const resp = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = await resp.json();
        const specs = getSpecialties();
        const results = data.elements.map(el => {
          const lat = el.lat || (el.center && el.center.lat);
          const lon = el.lon || (el.center && el.center.lon);
          const name = el.tags.name || 'Unnamed Hospital';
          const opening = el.tags.opening_hours || null;
          const distance = lat && lon ? haversineDistance(activeLocation.lat, activeLocation.lon, lat, lon).toFixed(2) : null;
          // Simple specialty detection via tags (e.g., "emergency", "cardiology")
          const tags = Object.values(el.tags).join(' ').toLowerCase();
          const matchesSpecialty = specs.some(s => tags.includes(s));
          return {
            id: el.id,
            name,
            distance: distance ? `${distance} km` : 'N/A',
            open: opening ? true : false, // we don't parse exact times here
            type: matchesSpecialty ? 'Specialty' : 'Hospital',
            lat,
            lon,
            opening
          };
        });
        // Sort according to requirements: 24h/emergency first, then closest, then specialty
        const sorted = results.sort((a, b) => {
          // Prioritize emergency (we treat any with opening_hours containing "24/7" as emergency)
          const aEmergency = a.opening && a.opening.includes('24/7');
          const bEmergency = b.opening && b.opening.includes('24/7');
          if (aEmergency && !bEmergency) return -1;
          if (!aEmergency && bEmergency) return 1;
          // Closest distance
          const aDist = parseFloat(a.distance);
          const bDist = parseFloat(b.distance);
          if (aDist !== bDist) return aDist - bDist;
          // Specialty
          if (a.type === 'Specialty' && b.type !== 'Specialty') return -1;
          if (a.type !== 'Specialty' && b.type === 'Specialty') return 1;
          return 0;
        });
        setHospitals(sorted);
      } catch (e) {
        console.error('Failed to fetch hospitals', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, [activeLocation, condition]);

  const filtered = filter === 'All' ? hospitals : hospitals.filter(h => h.type === filter);

  return (
    <div className="nearby-container">
      <div className="nearby-header">
        <div>
          <h2 className="page-title">{getTranslation(selectedLanguage, 'nearby_medical_help')}</h2>
          <p className="subtitle">{getTranslation(selectedLanguage, 'closest_assistance')}</p>
        </div>
        <button className="location-btn" onClick={handleGetLocation}>
          <Crosshair size={20} /> {getTranslation(selectedLanguage, 'use_my_location')}
        </button>
      </div>

      <div className="filter-tabs">
        {['All', 'Hospital', 'Specialty'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {getTranslation(selectedLanguage, f.toLowerCase())}
          </button>
        ))}
      </div>

      {!activeLocation && !loading ? (
        <div className="no-location-view">
          <MapPin size={48} color="var(--color-primary-300)" />
          <p>{getTranslation(selectedLanguage, 'high_risk_location_prompt')}</p>
          <button className="location-btn" onClick={handleGetLocation}>
            {getTranslation(selectedLanguage, 'turn_on_location')}
          </button>
        </div>
      ) : loading ? (
        <p>{getTranslation(selectedLanguage, 'loading')}</p>
      ) : (
        <div className="content-layout">
          <div className="list-view">
            {filtered.map(hospital => (
              <div key={hospital.id} className="hospital-card card">
                <div className="hospital-info">
                  <h3>{hospital.name}</h3>
                  <div className="meta-info">
                    <span className="type-badge">{hospital.type}</span>
                    <span className="distance-badge">
                      <MapPin size={14} /> {hospital.distance}
                    </span>
                    <span className={`status-badge ${hospital.open ? 'open' : 'closed'}`}>
                      {hospital.open ? getTranslation(selectedLanguage, 'open_now') : getTranslation(selectedLanguage, 'closed')}
                    </span>
                  </div>
                </div>
                <div className="action-buttons">
                  <button className="map-btn" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lon}`, '_blank')}>
                    <Map size={16} /> {getTranslation(selectedLanguage, 'view_on_map')}
                  </button>
                  <button className="directions-btn" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`, '_blank')}>
                    <ArrowRight size={16} /> {getTranslation(selectedLanguage, 'get_directions')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="map-view card">
            <div className="map-placeholder">
              <Map size={64} color="var(--color-border)" />
              <p>{getTranslation(selectedLanguage, 'interactive_map_view')}</p>
              <span className="location-text">📍 {getTranslation(selectedLanguage, 'showing_nearby')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="safety-message">
        {getTranslation(selectedLanguage, 'nearby_help_safety_message')}
      </div>
    </div>
  );
};

export default NearbyHelp;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Crosshair, Navigation, Phone, AlertCircle, Layers, Map, Satellite } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import './NearbyHelp.css';

// ─── Haversine distance ───────────────────────────────────────────────────────
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Tile layer definitions ────────────────────────────────────────────────────
const TILE_LAYERS = {
  dark: {
    label: 'Dark',
    icon: '🌑',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '©OpenStreetMap ©CARTO',
    subdomains: 'abcd',
  },
  light: {
    label: 'Light',
    icon: '☀️',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '©OpenStreetMap ©CARTO',
    subdomains: 'abcd',
  },
  street: {
    label: 'Street',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '©OpenStreetMap contributors',
    subdomains: 'abc',
  },
  satellite: {
    label: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '©Esri ©DigitalGlobe',
    subdomains: null,
  },
  hybrid: {
    label: 'Hybrid',
    icon: '🌍',
    // Satellite base + street labels overlay (two layers)
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
    attribution: '©Esri ©CARTO',
    subdomains: null,
    overlaySubdomains: 'abcd',
  },
};

// ─── Leaflet Map Component ────────────────────────────────────────────────────
const LeafletMap = ({ userLocation, hospitals, selectedHospital, activeTile }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersMapRef = useRef({}); // hospital.id → {marker, popup}
  const tileLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const initializedRef = useRef(false);

  // ── Initialize map once ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;

    const init = async () => {
      const L = await import('leaflet');

      // Fix Vite marker icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: true });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
      initializedRef.current = true;

      // Initial tile layer
      const tileConfig = TILE_LAYERS[activeTile] || TILE_LAYERS.dark;
      tileLayerRef.current = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: tileConfig.subdomains || 'abc',
        maxZoom: 20,
      }).addTo(map);

      if (tileConfig.overlayUrl) {
        overlayLayerRef.current = L.tileLayer(tileConfig.overlayUrl, {
          subdomains: tileConfig.overlaySubdomains || 'abcd',
          maxZoom: 20,
        }).addTo(map);
      }

      // User marker
      const userIcon = L.divIcon({
        className: '',
        html: `<div class="user-map-marker"><div class="user-dot"></div><div class="user-pulse"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>📍 Your Location</b>');

      // Hospital markers
      const hospitalIcon = L.divIcon({
        className: '',
        html: `<div class="hospital-map-pin">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
            <path fill="#ef4444" stroke="white" stroke-width="1" d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <text x="12" y="13" text-anchor="middle" fill="white" font-size="8" font-weight="bold" dy="0.3em">H</text>
          </svg>
        </div>`,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });

      const bounds = [[userLocation.lat, userLocation.lon]];
      hospitals.forEach((h) => {
        if (!h.lat || !h.lon) return;
        bounds.push([h.lat, h.lon]);

        const popup = L.popup({ maxWidth: 240, className: 'nexa-popup' }).setContent(`
          <div style="font-family:system-ui;padding:4px">
            <div style="font-weight:800;font-size:0.95rem;margin-bottom:6px;color:#0f172a">${h.name}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
              <span style="background:#f0fdf4;color:#059669;padding:2px 8px;border-radius:6px;font-size:0.78rem;font-weight:700">${h.distance}</span>
              <span style="background:#fef2f2;color:#ef4444;padding:2px 8px;border-radius:6px;font-size:0.78rem;font-weight:700">${h.type}</span>
            </div>
            <div style="display:flex;gap:6px">
              ${h.phone ? `<a href="tel:${h.phone}" style="flex:1;text-align:center;padding:7px;background:#f1f5f9;color:#0b7a75;border-radius:8px;text-decoration:none;font-size:0.82rem;font-weight:700">📞 Call</a>` : ''}
              <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}" target="_blank" style="flex:1;text-align:center;padding:7px;background:#0b7a75;color:white;border-radius:8px;text-decoration:none;font-size:0.82rem;font-weight:700">↗ Directions</a>
            </div>
          </div>
        `);

        const marker = L.marker([h.lat, h.lon], { icon: hospitalIcon }).addTo(map).bindPopup(popup);
        markersMapRef.current[h.id] = { marker, popup };
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([userLocation.lat, userLocation.lon], 14);
      }

      // Ensure map tiles load fully after container is rendered
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersMapRef.current = {};
        initializedRef.current = false;
      }
    };
    // eslint-disable-next-line
  }, [userLocation, hospitals]);

  // ── Fly to selected hospital ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedHospital || !mapInstanceRef.current) return;
    const entry = markersMapRef.current[selectedHospital.id];
    if (entry) {
      mapInstanceRef.current.flyTo([selectedHospital.lat, selectedHospital.lon], 16, {
        animate: true,
        duration: 0.5, // Faster animation
      });
      setTimeout(() => entry.marker.openPopup(), 600);
    }
  }, [selectedHospital]);

  // ── Switch tile layer ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !initializedRef.current) return;

    import('leaflet').then((L) => {
      // Remove existing layers
      if (tileLayerRef.current) { map.removeLayer(tileLayerRef.current); tileLayerRef.current = null; }
      if (overlayLayerRef.current) { map.removeLayer(overlayLayerRef.current); overlayLayerRef.current = null; }

      const tileConfig = TILE_LAYERS[activeTile] || TILE_LAYERS.dark;
      tileLayerRef.current = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: tileConfig.subdomains || 'abc',
        maxZoom: 20,
      }).addTo(map);

      if (tileConfig.overlayUrl) {
        overlayLayerRef.current = L.tileLayer(tileConfig.overlayUrl, {
          subdomains: tileConfig.overlaySubdomains || 'abcd',
          maxZoom: 20,
        }).addTo(map);
      }

      // Re-raise markers so they appear above tiles
      Object.values(markersMapRef.current).forEach(({ marker }) => marker.bringToFront?.());
      if (userMarkerRef.current) userMarkerRef.current.bringToFront?.();
    });
  }, [activeTile]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', borderRadius: '16px', minHeight: '450px' }}
    />
  );
};

// ─── Main NearbyHelp Component ────────────────────────────────────────────────
const NearbyHelp = ({ selectedLanguage, location, condition }) => {
  const [hospitals, setHospitals] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  const [internalLocation, setInternalLocation] = useState(location || null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [activeTile, setActiveTile] = useState('dark');
  const [showTilePicker, setShowTilePicker] = useState(false);

  useEffect(() => { if (location) setInternalLocation(location); }, [location]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation is not supported.'); return; }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInternalLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      (err) => { setError('Unable to retrieve location. Please allow location access.'); setLocating(false); },
      { timeout: 12000 }
    );
  };

  useEffect(() => {
    if (!internalLocation) return;
    const fetchHospitals = async () => {
      setLoading(true);
      setError(null);
      const radius = 5000;
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${radius},${internalLocation.lat},${internalLocation.lon});
          way["amenity"="hospital"](around:${radius},${internalLocation.lat},${internalLocation.lon});
          relation["amenity"="hospital"](around:${radius},${internalLocation.lat},${internalLocation.lon});
          node["amenity"="clinic"](around:${radius},${internalLocation.lat},${internalLocation.lon});
        );
        out center tags;`;
      try {
        const resp = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST', body: query,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = await resp.json();
        const results = data.elements.map((el) => {
          const lat = el.lat || (el.center?.lat);
          const lon = el.lon || (el.center?.lon);
          const name = el.tags?.name || 'Unnamed Facility';
          const opening = el.tags?.opening_hours || null;
          const phone = el.tags?.phone || el.tags?.['contact:phone'] || null;
          const distNum = lat && lon ? haversineDistance(internalLocation.lat, internalLocation.lon, lat, lon) : 999;
          return {
            id: el.id, name, lat, lon,
            distance: distNum < 999 ? `${distNum.toFixed(2)} km` : 'N/A',
            distanceNum: distNum,
            open: opening?.includes('24/7') ? true : opening ? null : null,
            type: el.tags?.amenity === 'clinic' ? 'Clinic' : 'Hospital',
            phone,
          };
        }).sort((a, b) => a.distanceNum - b.distanceNum);
        setHospitals(results);
      } catch (e) {
        setError('Failed to fetch nearby hospitals. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, [internalLocation]);

  const handleHospitalClick = (hospital) => {
    setSelectedHospital(hospital);
  };

  const filtered = filter === 'All' ? hospitals : hospitals.filter((h) => h.type === filter);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, x: -15 }, show: { opacity: 1, x: 0 } };

  return (
    <div className="nearby-container">
      {/* ── Header ── */}
      <div className="nearby-header">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="nearby-title">Nearby Medical Help</h2>
          <p className="nearby-subtitle">Click a hospital in the list to locate it on the map</p>
        </motion.div>
        <motion.button
          className={`locate-btn ${locating ? 'locating' : ''}`}
          onClick={handleGetLocation}
          disabled={locating}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Crosshair size={18} className={locating ? 'spin-icon' : ''} />
          {locating ? 'Locating…' : 'Locate My Location'}
        </motion.button>
      </div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div className="error-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {!internalLocation && !loading ? (
        /* ── No Location ── */
        <motion.div className="no-location-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="no-location-icon"><MapPin size={48} /></div>
          <h3>Enable Location Access</h3>
          <p>Allow Nexa Health to access your location to find nearby hospitals and medical facilities with real-time pins on the map.</p>
          <button className="locate-btn large" onClick={handleGetLocation}>
            <Navigation size={20} /> Locate My Location
          </button>
        </motion.div>
      ) : (
        <div className="nearby-content-layout">

          {/* ── MAP PANEL ── */}
          <div className="map-panel">
            {/* Tile Layer Switcher */}
            <div className="tile-switcher-wrapper">
              <motion.button
                className="tile-toggle-btn"
                onClick={() => setShowTilePicker((v) => !v)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Change map view"
              >
                <Layers size={18} />
                <span>{TILE_LAYERS[activeTile].icon} {TILE_LAYERS[activeTile].label}</span>
              </motion.button>

              <AnimatePresence>
                {showTilePicker && (
                  <motion.div
                    className="tile-picker"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    {Object.entries(TILE_LAYERS).map(([key, val]) => (
                      <button
                        key={key}
                        className={`tile-option ${activeTile === key ? 'active' : ''}`}
                        onClick={() => { setActiveTile(key); setShowTilePicker(false); }}
                      >
                        <span className="tile-emoji">{val.icon}</span>
                        <span>{val.label}</span>
                        {activeTile === key && <span className="tile-check">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {loading && (
              <div className="map-loading-overlay">
                <div className="map-spinner" />
                <span>Loading hospitals…</span>
              </div>
            )}
            {internalLocation && !loading && (
              <LeafletMap
                userLocation={internalLocation}
                hospitals={hospitals}
                selectedHospital={selectedHospital}
                activeTile={activeTile}
              />
            )}
          </div>

          {/* ── HOSPITAL LIST PANEL ── */}
          <div className="hospitals-panel">
            <div className="filter-tabs">
              {['All', 'Hospital', 'Clinic'].map((f) => (
                <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>

            {hospitals.length > 0 && !loading && (
              <p className="hospitals-count">{filtered.length} facilities found near you</p>
            )}

            {loading ? (
              <div className="list-loading">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-list">
                <MapPin size={40} />
                <p>No facilities found nearby.</p>
              </div>
            ) : (
              <motion.div className="hospital-list" variants={containerVariants} initial="hidden" animate="show">
                {filtered.map((hospital) => (
                  <motion.div
                    key={hospital.id}
                    className={`hospital-card ${selectedHospital?.id === hospital.id ? 'selected' : ''}`}
                    variants={itemVariants}
                    whileHover={{ scale: 1.015, x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleHospitalClick(hospital)}
                    title="Click to locate on map"
                  >
                    <div className="hospital-top">
                      <div className={`hospital-icon-wrap ${selectedHospital?.id === hospital.id ? 'active' : ''}`}>
                        <MapPin size={18} />
                      </div>
                      <div className="hospital-details">
                        <h4>{hospital.name}</h4>
                        <div className="hospital-meta">
                          <span className="badge distance"><MapPin size={11} /> {hospital.distance}</span>
                          {hospital.open === true && <span className="badge status open">24/7</span>}
                          {hospital.open === null && <span className="badge status unknown">Open</span>}
                          <span className="badge type">{hospital.type}</span>
                        </div>
                      </div>
                    </div>

                    {selectedHospital?.id === hospital.id && (
                      <motion.div
                        className="hospital-actions"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.2 }}
                      >
                        {hospital.phone && (
                          <a href={`tel:${hospital.phone}`} className="action-btn call" onClick={(e) => e.stopPropagation()}>
                            <Phone size={14} /> Call
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn directions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Navigation size={14} /> Get Directions
                        </a>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}

      <div className="safety-note">
        <AlertCircle size={14} /> This information helps locate nearby hospitals but does not replace professional medical advice.
      </div>
    </div>
  );
};

export default NearbyHelp;

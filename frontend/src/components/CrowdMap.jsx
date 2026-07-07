import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { fetchZones, SOCKET_URL } from '../api';

const DENSITY_COLORS = {
  low: '#2e7d32',
  medium: '#f9a825',
  high: '#ef6c00',
  critical: '#c62828',
};

export default function CrowdMap({ strings }) {
  const [zones, setZones] = useState([]);
  const [connError, setConnError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    fetchZones()
      .then((data) => {
        if (mounted) setZones(data);
      })
      .catch((err) => {
        if (mounted) setConnError(err.message);
      });

    const socket = io(SOCKET_URL, { reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on('zone_update', (updatedZone) => {
      setZones((prev) => {
        const idx = prev.findIndex((z) => z.zoneId === updatedZone.zoneId);
        if (idx === -1) return [...prev, updatedZone];
        const next = [...prev];
        next[idx] = updatedZone;
        return next;
      });
    });

    socket.on('connect_error', () => {
      setConnError('Live updates unavailable — showing last known data.');
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  return (
    <section className="crowd-map" aria-label={strings.liveMap}>
      <h2>{strings.liveMap}</h2>
      {connError && <p className="crowd-map-warning">{connError}</p>}
      <svg viewBox="0 0 400 300" role="img" aria-label="Stadium crowd density map">
        <rect x="0" y="0" width="400" height="300" fill="var(--surface-2, #1a1a2e)" rx="12" />
        {zones.map((z) => (
          <g key={z.zoneId}>
            <circle
              cx={z.coordinates?.x ?? 0}
              cy={z.coordinates?.y ?? 0}
              r="14"
              fill={DENSITY_COLORS[z.densityLevel] || DENSITY_COLORS.low}
            >
              <title>
                {z.name}: {z.currentCount}/{z.capacity} ({z.densityLevel})
              </title>
            </circle>
            <text
              x={z.coordinates?.x ?? 0}
              y={(z.coordinates?.y ?? 0) + 26}
              fontSize="10"
              fill="var(--text-primary, #fff)"
              textAnchor="middle"
            >
              {z.name}
            </text>
          </g>
        ))}
      </svg>

      <ul className="zone-legend">
        {Object.entries(DENSITY_COLORS).map(([level, color]) => (
          <li key={level}>
            <span className="legend-dot" style={{ backgroundColor: color }} />
            {level}
          </li>
        ))}
      </ul>
    </section>
  );
}

CrowdMap.propTypes = {
  strings: PropTypes.object.isRequired,
};

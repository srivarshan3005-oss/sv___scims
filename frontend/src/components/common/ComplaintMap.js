/**
 * ComplaintMap
 * -----------
 * Renders a Leaflet/OpenStreetMap map showing one or more complaint locations.
 *
 * Props:
 *   complaints  – array of ComplaintResponse objects (use [singleComplaint] for detail view)
 *   height      – CSS height string, default '360px'
 *   center      – [lat, lng] default centre; auto-derived from complaints if omitted
 *   zoom        – initial zoom level, default 14
 *
 * The component is dynamically importable so it only loads Leaflet when actually
 * rendered (the bundle is ~160 KB; no need to load it on every page).
 */
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icon path broken by webpack asset hashing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom pin colours per complaint status
const STATUS_COLOUR = {
    PENDING:     'orange',
    IN_PROGRESS: 'blue',
    RESOLVED:    'green',
    REJECTED:    'red',
    CLOSED:      'grey',
};

function colourIcon(colour) {
    // Simple SVG pin matching Bootstrap Icons style
    const svg = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z"
                  fill="${colour}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="5" fill="#fff"/>
        </svg>`);
    return L.icon({
        iconUrl: `data:image/svg+xml,${svg}`,
        iconSize:   [24, 36],
        iconAnchor: [12, 36],
        popupAnchor:[0, -36],
    });
}

/** Fly the map to fit all markers when complaints list changes. */
function FitBounds({ positions }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length === 0) return;
        if (positions.length === 1) {
            map.setView(positions[0], map.getZoom());
        } else {
            map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
        }
    }, [map, positions]);
    return null;
}

export default function ComplaintMap({ complaints = [], height = '360px', center, zoom = 14 }) {
    // Only complaints that have GPS coordinates
    const geoComplaints = complaints.filter(
        c => c.latitude != null && c.longitude != null
    );

    const positions = geoComplaints.map(c => [c.latitude, c.longitude]);

    // Default map centre: first complaint, or fallback to [0,0]
    const defaultCenter = center ||
        (positions.length > 0 ? positions[0] : [20, 78]); // India fallback

    if (geoComplaints.length === 0) {
        return (
            <div
                className="d-flex flex-column align-items-center justify-content-center text-muted gap-2"
                style={{ height, background: '#f8fafc', borderRadius: '0.5rem',
                         border: '1px dashed #cbd5e1' }}
            >
                <i className="bi bi-geo-slash" style={{ fontSize: '2rem' }}></i>
                <span className="small">No GPS location recorded for this complaint</span>
            </div>
        );
    }

    return (
        <MapContainer
            center={defaultCenter}
            zoom={zoom}
            style={{ height, width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds positions={positions} />
            {geoComplaints.map(c => {
                const colour = STATUS_COLOUR[c.status] || 'blue';
                return (
                    <React.Fragment key={c.id}>
                        <Marker
                            position={[c.latitude, c.longitude]}
                            icon={colourIcon(colour)}
                        >
                            <Popup>
                                <strong>#{c.id} — {c.title}</strong><br />
                                <span className="badge bg-secondary">{c.status}</span>
                                &nbsp;<span className="badge bg-light text-dark">{c.priority}</span>
                                <br />
                                <small>{c.location}</small>
                                {c.gpsAccuracy != null && (
                                    <><br /><small className="text-muted">
                                        GPS accuracy: ±{Math.round(c.gpsAccuracy)} m
                                    </small></>
                                )}
                                {c.departmentName && (
                                    <><br /><small className="text-muted">{c.departmentName}</small></>
                                )}
                                <br />
                                <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                                   target="_blank" rel="noreferrer"
                                   className="small">
                                    Open in Google Maps ↗
                                </a>
                            </Popup>
                        </Marker>
                        {/* Accuracy circle — shown only when accuracy > 10 m */}
                        {c.gpsAccuracy != null && c.gpsAccuracy > 10 && (
                            <Circle
                                center={[c.latitude, c.longitude]}
                                radius={c.gpsAccuracy}
                                pathOptions={{ color: colour, fillColor: colour, fillOpacity: 0.08, weight: 1 }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </MapContainer>
    );
}

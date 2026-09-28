/**
 * @file HRSettings.tsx
 * @description React component for rendering HRSettings UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */


import React, { useState, useEffect, useRef } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { MapPin, Navigation } from 'lucide-react';

interface OfficeLocationSettings {
    latitude: number;
    longitude: number;
    radius: number; // in meters
    enabled: boolean;
    bypassDepartments?: string[];
}

const HRSettings: React.FC = () => {
    const [settings, setSettings] = useState<OfficeLocationSettings>({
        latitude: 51.505,
        longitude: -0.09,
        radius: 100,
        enabled: false,
        bypassDepartments: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const settingsRef = useRef(settings);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'general');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.officeLocation) {
                        setSettings(data.officeLocation);
                    }
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                toast.error("Failed to load settings.");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    useEffect(() => {
        if (loading) return;

        const initializeMap = () => {
            const L = (window as any).L;
            if (!L || mapRef.current) return;

            const mapElement = document.getElementById('officeMap');
            if (!mapElement) return;

            // Default center (use saved location or default to a world view)
            const currentSettings = settingsRef.current;
            const defaultLat = (currentSettings.latitude && !isNaN(currentSettings.latitude)) ? currentSettings.latitude : 51.505;
            const defaultLng = (currentSettings.longitude && !isNaN(currentSettings.longitude)) ? currentSettings.longitude : -0.09;
            const hasValidLocation = defaultLat !== 51.505 || defaultLng !== -0.09;
            const defaultZoom = hasValidLocation ? 15 : 2;

            // Initialize map
            const map = L.map('officeMap').setView([defaultLat, defaultLng], defaultZoom);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add marker if location is set
            if (currentSettings.latitude && currentSettings.longitude && !isNaN(currentSettings.latitude) && !isNaN(currentSettings.longitude) && hasValidLocation) {
                const marker = L.marker([currentSettings.latitude, currentSettings.longitude], { draggable: true }).addTo(map);
                
                // Add circle for radius
                const circle = L.circle([currentSettings.latitude, currentSettings.longitude], {
                    radius: currentSettings.radius,
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2
                }).addTo(map);

                // Update position when marker is dragged
                marker.on('dragend', (e: any) => {
                    const pos = e.target.getLatLng();
                    setSettings(prev => ({
                        ...prev,
                        latitude: pos.lat,
                        longitude: pos.lng
                    }));
                    circle.setLatLng(pos);
                });

                markerRef.current = { marker, circle };
            }

            // Click on map to set location
            map.on('click', (e: any) => {
                const { lat, lng } = e.latlng;
                setSettings(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                }));

                // Remove old marker if exists
                if (markerRef.current) {
                    markerRef.current.marker.remove();
                    markerRef.current.circle.remove();
                }

                // Add new marker
                const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
                const circle = L.circle([lat, lng], {
                    radius: settingsRef.current.radius,
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2
                }).addTo(map);

                marker.on('dragend', (dragEvent: any) => {
                    const pos = dragEvent.target.getLatLng();
                    setSettings(prev => ({
                        ...prev,
                        latitude: pos.lat,
                        longitude: pos.lng
                    }));
                    circle.setLatLng(pos);
                });

                markerRef.current = { marker, circle };
            });

            mapRef.current = map;
        };

        // Load Leaflet CSS and JS dynamically
        const loadLeaflet = async () => {
            // Check if already loaded
            if ((window as any).L) {
                initializeMap();
                return;
            }

            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document.head.appendChild(link);

            // Load JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.onload = () => {
                initializeMap();
            };
            document.head.appendChild(script);
        };

        loadLeaflet();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [loading]);

    // Update circle radius when radius changes
    useEffect(() => {
        if (markerRef.current && markerRef.current.circle) {
            markerRef.current.circle.setRadius(settings.radius);
        }
    }, [settings.radius]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, 'settings', 'general');
            await setDoc(docRef, { officeLocation: settings }, { merge: true });
            toast.success("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        toast.loading("Getting current location...", { id: 'geo' });
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setSettings(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                }));

                // Update map view and marker
                if (mapRef.current) {
                    const L = (window as any).L;
                    mapRef.current.setView([lat, lng], 15);

                    // Remove old marker if exists
                    if (markerRef.current) {
                        markerRef.current.marker.remove();
                        markerRef.current.circle.remove();
                    }

                    // Add new marker
                    const marker = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
                    const circle = L.circle([lat, lng], {
                        radius: settings.radius,
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2
                    }).addTo(mapRef.current);

                    marker.on('dragend', (e: any) => {
                        const pos = e.target.getLatLng();
                        setSettings(prev => ({
                            ...prev,
                            latitude: pos.lat,
                            longitude: pos.lng
                        }));
                        circle.setLatLng(pos);
                    });

                    markerRef.current = { marker, circle };
                }

                toast.dismiss('geo');
                toast.success("Current location set!");
            },
            (error) => {
                toast.dismiss('geo');
                console.error("Error getting location:", error);
                toast.error("Failed to get current location.");
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
        );
    };

    if (loading) return <div className="p-4 text-center">Loading settings...</div>;

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="text-primary" />
                Attendance Settings
            </h2>

            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Office Location Restriction</h3>
                        <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.enabled}
                                    onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                <span className="ml-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {settings.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        When enabled, employees can only check in/out when they are within the specified radius of the office location.
                    </p>

                    {/* Interactive Map */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                            Office Location (Click on map or drag marker)
                        </label>
                        <div id="officeMap" style={{ height: '400px', width: '100%' }} className="rounded-lg border-2 border-slate-200 dark:border-slate-700"></div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            💡 Click anywhere on the map to set office location, or drag the marker to adjust
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={settings.latitude}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const lat = val === '' ? 0 : parseFloat(val);
                                    if (!isNaN(lat)) {
                                        setSettings(prev => ({ ...prev, latitude: lat }));
                                        
                                        // Update map
                                        if (mapRef.current && !isNaN(settings.longitude)) {
                                            mapRef.current.setView([lat, settings.longitude], 15);
                                            if (markerRef.current) {
                                                markerRef.current.marker.setLatLng([lat, settings.longitude]);
                                                markerRef.current.circle.setLatLng([lat, settings.longitude]);
                                            }
                                        }
                                    }
                                }}
                                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={settings.longitude}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const lng = val === '' ? 0 : parseFloat(val);
                                    if (!isNaN(lng)) {
                                        setSettings(prev => ({ ...prev, longitude: lng }));
                                        
                                        // Update map
                                        if (mapRef.current && !isNaN(settings.latitude)) {
                                            mapRef.current.setView([settings.latitude, lng], 15);
                                            if (markerRef.current) {
                                                markerRef.current.marker.setLatLng([settings.latitude, lng]);
                                                markerRef.current.circle.setLatLng([settings.latitude, lng]);
                                            }
                                        }
                                    }
                                }}
                                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Allowed Radius (meters)</label>
                        <input
                            type="number"
                            value={settings.radius}
                            onChange={(e) => {
                                const val = e.target.value;
                                const radius = val === '' ? 100 : parseFloat(val);
                                if (!isNaN(radius) && radius > 0) {
                                    setSettings(prev => ({ ...prev, radius }));
                                }
                            }}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recommended: 50-100 meters</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                            Bypass Location Restriction for Departments
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {['HR', 'Management', 'Development', 'SEO', 'Product', 'Media', 'Sales', 'Visitor'].map(dept => (
                                <label key={dept} className="flex items-center p-3 bg-white border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                                        checked={settings.bypassDepartments?.includes(dept)}
                                        onChange={(e) => {
                                            const current = settings.bypassDepartments || [];
                                            if (e.target.checked) {
                                                setSettings(prev => ({ ...prev, bypassDepartments: [...current, dept] }));
                                            } else {
                                                setSettings(prev => ({ ...prev, bypassDepartments: current.filter(d => d !== dept) }));
                                            }
                                        }}
                                    />
                                    <span className="ml-3 text-sm font-medium text-slate-700">{dept}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Employees in checked departments will be able to check in/out from anywhere, even if location restriction is enabled.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={getCurrentLocation} type="button" className="flex items-center gap-2">
                            <Navigation size={16} />
                            Use My Location
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default HRSettings;

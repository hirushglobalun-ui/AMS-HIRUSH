/**
 * @file AdminSettings.tsx
 * @description React component for Admin Attendance Settings.
 * Provides clean selection between:
 * 1. Only Location
 * 2. Location + Fingerprint
 * Along with Office GPS radius setup.
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
import { MapPin, Navigation, Fingerprint, ShieldCheck } from 'lucide-react';
import { BiometricSettings } from '../../types';

interface OfficeLocationSettings {
    latitude: number;
    longitude: number;
    radius: number; // in meters
    enabled: boolean;
    bypassDepartments?: string[];
}

const AdminSettings: React.FC = () => {
    const [settings, setSettings] = useState<OfficeLocationSettings>({
        latitude: 51.505,
        longitude: -0.09,
        radius: 100,
        enabled: true,
        bypassDepartments: []
    });
    const [biometricSettings, setBiometricSettings] = useState<BiometricSettings>({
        enabled: true,
        verificationMode: 'location_and_biometric',
        autoApproveFirstDevice: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mapInitialized, setMapInitialized] = useState(false);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

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
                    if (data.biometricSettings) {
                        const isBio = data.biometricSettings.enabled ?? true;
                        setBiometricSettings({
                            enabled: isBio,
                            verificationMode: data.biometricSettings.verificationMode || (isBio ? 'location_and_biometric' : 'location_only'),
                            autoApproveFirstDevice: false
                        });
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

    // Initialize Leaflet Map
    useEffect(() => {
        if (loading) return;

        const loadLeaflet = async () => {
            if ((window as any).L) {
                initializeMap();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.onload = () => {
                initializeMap();
            };
            document.head.appendChild(script);
        };

        const initializeMap = () => {
            const L = (window as any).L;
            if (!L || mapInitialized) return;

            const mapElement = document.getElementById('officeMap');
            if (!mapElement) return;

            const defaultLat = (settings.latitude && !isNaN(settings.latitude)) ? settings.latitude : 51.505;
            const defaultLng = (settings.longitude && !isNaN(settings.longitude)) ? settings.longitude : -0.09;
            const hasValidLocation = defaultLat !== 51.505 || defaultLng !== -0.09;
            const defaultZoom = hasValidLocation ? 15 : 2;

            const map = L.map('officeMap').setView([defaultLat, defaultLng], defaultZoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            if (settings.latitude && settings.longitude && !isNaN(settings.latitude) && !isNaN(settings.longitude) && hasValidLocation) {
                const marker = L.marker([settings.latitude, settings.longitude], { draggable: true }).addTo(map);
                const circle = L.circle([settings.latitude, settings.longitude], {
                    radius: settings.radius,
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2
                }).addTo(map);

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

            map.on('click', (e: any) => {
                const { lat, lng } = e.latlng;
                setSettings(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                }));

                if (markerRef.current) {
                    markerRef.current.marker.remove();
                    markerRef.current.circle.remove();
                }

                const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
                const circle = L.circle([lat, lng], {
                    radius: settings.radius,
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
            setMapInitialized(true);
        };

        loadLeaflet();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [loading]);

    useEffect(() => {
        if (markerRef.current && markerRef.current.circle) {
            markerRef.current.circle.setRadius(settings.radius);
        }
    }, [settings.radius]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, 'settings', 'general');
            await setDoc(docRef, { 
                officeLocation: { ...settings, enabled: true },
                biometricSettings
            }, { merge: true });
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

                if (mapRef.current) {
                    const L = (window as any).L;
                    mapRef.current.setView([lat, lng], 15);

                    if (markerRef.current) {
                        markerRef.current.marker.remove();
                        markerRef.current.circle.remove();
                    }

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <MapPin className="text-primary" />
                        Office GPS Location Settings
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Pin your office location on the map and set the allowed geofence check-in radius for employees.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                    {saving ? 'Saving...' : 'Save Location Settings'}
                </Button>
            </div>

            <div className="space-y-6">
                {/* Office Location Setup */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                            <MapPin className="text-primary flex-shrink-0" size={20} />
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                Office GPS Location & Radius
                            </h3>
                        </div>
                        <Button variant="secondary" onClick={getCurrentLocation} type="button" className="text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 w-full sm:w-auto">
                            <Navigation size={14} />
                            Use My Location
                        </Button>
                    </div>

                    {/* Interactive Map */}
                    <div className="mb-4">
                        <div id="officeMap" style={{ height: '350px', width: '100%' }} className="rounded-lg border-2 border-slate-200 dark:border-slate-700"></div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            💡 Click anywhere on the map to pin office location, or drag the blue marker.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={settings.latitude}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const lat = val === '' ? 0 : parseFloat(val);
                                    if (!isNaN(lat)) {
                                        setSettings(prev => ({ ...prev, latitude: lat }));
                                        if (mapRef.current && !isNaN(settings.longitude)) {
                                            mapRef.current.setView([lat, settings.longitude], 15);
                                            if (markerRef.current) {
                                                markerRef.current.marker.setLatLng([lat, settings.longitude]);
                                                markerRef.current.circle.setLatLng([lat, settings.longitude]);
                                            }
                                        }
                                    }
                                }}
                                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={settings.longitude}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const lng = val === '' ? 0 : parseFloat(val);
                                    if (!isNaN(lng)) {
                                        setSettings(prev => ({ ...prev, longitude: lng }));
                                        if (mapRef.current && !isNaN(settings.latitude)) {
                                            mapRef.current.setView([settings.latitude, lng], 15);
                                            if (markerRef.current) {
                                                markerRef.current.marker.setLatLng([settings.latitude, lng]);
                                                markerRef.current.circle.setLatLng([settings.latitude, lng]);
                                            }
                                        }
                                    }
                                }}
                                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Allowed Radius (meters)</label>
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
                                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                            Bypass Location Restriction for Departments
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {['SEO', 'Developer', 'Media', 'Visitor'].map(dept => (
                                <label key={dept} className="flex items-center p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
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
                                    <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-200">{dept}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default AdminSettings;

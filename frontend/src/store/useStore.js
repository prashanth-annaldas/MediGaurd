import { create } from 'zustand'
import { generateResourceData, generateAlerts } from '../utils/dataGenerators'

const useStore = create((set, get) => ({
    // ── Resources ──────────────────────────────────────────────────────────
    resources: generateResourceData(),
    lastRefreshed: new Date(),
    isLoading: false,

    // ── Alerts ─────────────────────────────────────────────────────────────
    alerts: generateAlerts(),
    unreadAlertCount: 0,

    // ── Toast ───────────────────────────────────────────────────────────────
    toasts: [],

    // ── Sidebar ─────────────────────────────────────────────────────────────
    sidebarCollapsed: false,

    // ── User Auth ───────────────────────────────────────────────────────────
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    setUser: (user, token) => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
        set({ user, token });
    },
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null });
    },

    // ── Trends ───────────────────────────────────────────────────────────────
    trends: [],
    forecastData: [],

    // ── Actions ─────────────────────────────────────────────────────────────
    fetchForecast: async (resourceId, horizon) => {
        try {
            const res = await fetch(`/api/forecast?resource_id=${resourceId}&horizon_hours=${horizon}`)
            if (res.ok) {
                const data = await res.json()
                set({ forecastData: data.forecast_points || [] })
            }
        } catch {
            // handled UI side
        }
    },

    predictionData: null,
    fetchPrediction: async (currentStats) => {
        try {
            // currentStats should shape to Match PredictRequest
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}/api/predict_shortage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentStats)
            })
            if (res.ok) {
                const data = await res.json()
                set({ predictionData: data })
            }
        } catch (e) {
            console.error("Failed to fetch prediction", e)
        }
    },

    fetchTrends: async (hospitalId = null) => {
        try {
            const hospitalName = get().user?.role === 'ADMIN' || get().user?.role === 'STAFF'
                ? get().user?.hospital_name
                : get().selectedHospital?.name;

            let url = '/api/trends';
            if (hospitalId) {
                url = `/api/trends?hospital_id=${hospitalId}`;
            } else if (hospitalName) {
                url = `/api/trends?hospital_name=${encodeURIComponent(hospitalName)}`;
            }

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                // Transform backend monthly stats into a flat format for Recharts
                const months = data.months
                const formatted = months.map((month, i) => {
                    const row = { month }
                    Object.keys(data.resources).forEach(key => {
                        row[key] = data.resources[key][i].utilization
                    })
                    return row
                })
                set({ trends: formatted })
            }
        } catch {
            // fallback handled by Dashboard
        }
    },

    refreshData: async (hospitalId = null) => {
        set({ isLoading: true })
        try {
            const hospitalName = get().user?.role === 'ADMIN' || get().user?.role === 'STAFF'
                ? get().user?.hospital_name
                : get().selectedHospital?.name;

            let url = '/api/resources';
            if (hospitalId) {
                url = `/api/resources?hospital_id=${hospitalId}`;
            } else if (hospitalName) {
                url = `/api/resources?hospital_name=${encodeURIComponent(hospitalName)}`;
            }

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                const mapped = data.resources.map(r => ({
                    ...r,
                    utilization: r.utilization,
                    value: r.utilization,
                }))
                set({ resources: mapped })
            }
        } catch {
            // Backend not available — use local simulation
            set({ resources: generateResourceData() })
        }
        set({ isLoading: false, lastRefreshed: new Date() })
    },

    fetchAlerts: async () => {
        try {
            const hospitalName = get().user?.role === 'ADMIN' || get().user?.role === 'STAFF'
                ? get().user?.hospital_name
                : get().selectedHospital?.name;

            const url = hospitalName ? `/api/alerts?hospital_name=${encodeURIComponent(hospitalName)}` : '/api/alerts';
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                set({ alerts: data.alerts })
            }
        } catch {
            // fallback
        }
    },

    simulateAlert: () => {
        const alertTypes = [
            {
                id: `sim_${Date.now()}`,
                resource: 'ICU Beds',
                resource_id: 'icu_beds',
                severity: 'critical',
                message: 'SIMULATED: ICU capacity surge detected — projected breach in 18.4 hours',
                utilization: 89.2,
                hours_to_breach: 18.4,
                trend: 'rising',
                recommendations: [
                    'Activate ICU capacity expansion protocol immediately',
                    'Begin early discharge review for stable ICU patients',
                    'Coordinate with ED to hold non-critical admissions',
                    'Contact partner hospitals about transfer capacity',
                    'Notify on-call intensivists of projected shortage',
                ],
                created_at: new Date().toISOString(),
                isSimulated: true,
            },
            {
                id: `sim_${Date.now()}`,
                resource: 'Oxygen Supply',
                resource_id: 'oxygen_supply',
                severity: 'warning',
                message: 'SIMULATED: Oxygen supply depletion rate accelerating — 31 hours to critical threshold',
                utilization: 48.5,
                hours_to_breach: 31.0,
                trend: 'falling',
                recommendations: [
                    'Contact primary oxygen supplier for emergency delivery',
                    'Audit non-critical oxygen consumption across wards',
                    'Activate backup cylinder reserve protocol',
                    'Notify respiratory therapy department',
                ],
                created_at: new Date().toISOString(),
                isSimulated: true,
            },
        ]
        const newAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
        newAlert.id = `sim_${Date.now()}`

        const hospitalName = get().user?.role === 'ADMIN' || get().user?.role === 'STAFF'
            ? get().user?.hospital_name
            : get().selectedHospital?.name;

        newAlert.hospital_name = hospitalName;

        set(state => ({
            alerts: [newAlert, ...state.alerts],
            unreadAlertCount: state.unreadAlertCount + 1,
        }))

        get().addToast({
            type: newAlert.severity,
            title: `🚨 ${newAlert.resource} Alert`,
            message: newAlert.message,
        })
    },

    addAlert: async (alertData) => {
        const hospitalName = get().user?.role === 'ADMIN' || get().user?.role === 'STAFF'
            ? get().user?.hospital_name
            : get().selectedHospital?.name;

        const newAlert = {
            id: `alert_${Date.now()}`,
            created_at: new Date().toISOString(),
            hospital_name: hospitalName,
            ...alertData
        };

        // Optimistic UI update
        set(state => ({
            alerts: [newAlert, ...state.alerts],
            unreadAlertCount: state.unreadAlertCount + 1,
        }));

        get().addToast({
            type: newAlert.severity || 'info',
            title: `📋 System Update`,
            message: newAlert.message,
        });

        // Persist to DB
        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}/api/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAlert)
            });
        } catch (e) {
            console.error("Failed to persist alert", e);
        }
    },

    deleteAlert: async (id) => {
        set(state => ({
            alerts: state.alerts.filter(a => a.id !== id)
        }));

        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}/api/alerts/${id}`, { method: 'DELETE' });
        } catch (e) {
            console.error("Failed to delete alert", e);
        }
    },

    clearAllAlerts: async () => {
        set({ alerts: [], unreadAlertCount: 0 });

        try {
            const hospitalName = get().user?.role === 'ADMIN' || get().user?.role === 'STAFF'
                ? get().user?.hospital_name
                : get().selectedHospital?.name;

            const url = hospitalName ? `${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}/api/alerts?hospital_name=${encodeURIComponent(hospitalName)}` : `${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}/api/alerts`;
            await fetch(url, { method: 'DELETE' });
        } catch (e) {
            console.error("Failed to clear alerts", e);
        }
    },

    markAlertsRead: () => set({ unreadAlertCount: 0 }),

    addToast: (toast) => {
        const id = Date.now()
        set(state => ({ toasts: [...state.toasts, { ...toast, id }] }))
        setTimeout(() => {
            set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
        }, 5000)
    },

    dismissToast: (id) => {
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    },

    toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

    // ── Selected Hospital (User View) ───────────────────────────────────────
    selectedHospital: JSON.parse(localStorage.getItem('selectedHospital')) || null,
    setSelectedHospital: (hospital) => {
        localStorage.setItem('selectedHospital', JSON.stringify(hospital));
        set({ selectedHospital: hospital });
    },
    clearSelectedHospital: () => {
        localStorage.removeItem('selectedHospital');
        set({ selectedHospital: null });
    },

    // ── Theme ───────────────────────────────────────────────────────────────
    theme: localStorage.getItem('theme') || 'dark',
    toggleTheme: () => set(state => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        return { theme: newTheme };
    }),
}))

export default useStore

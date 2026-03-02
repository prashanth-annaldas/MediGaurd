/**
 * MedGuard AI — Data Generation Utilities
 * Generates realistic hospital resource data for demo/simulation
 * Zero patient data — only aggregated operational metrics
 */

import { addDays, subDays } from '../utils/dateUtils'

const RESOURCE_DEFINITIONS = [
    {
        id: 'icu_beds',
        name: 'ICU Beds',
        icon: '🛏️',
        unit: 'utilization %',
        baseUtil: 78.5,
        criticalThreshold: 85,
        warningThreshold: 72,
        inverted: false,
        description: 'Intensive Care Unit bed occupancy rate',
        color: '#3b82f6',
    },
    {
        id: 'oxygen_supply',
        name: 'Oxygen Supply',
        icon: '💨',
        unit: '% remaining',
        baseUtil: 62.0,
        criticalThreshold: 30,
        warningThreshold: 45,
        inverted: true,
        description: 'Central oxygen supply level',
        color: '#06b6d4',
    },
    {
        id: 'ventilators',
        name: 'Ventilators',
        icon: '🫁',
        unit: 'utilization %',
        baseUtil: 71.3,
        criticalThreshold: 80,
        warningThreshold: 65,
        inverted: false,
        description: 'Mechanical ventilator utilization',
        color: '#8b5cf6',
    },
    {
        id: 'blood_bank',
        name: 'Blood Bank',
        icon: '🩸',
        unit: '% capacity',
        baseUtil: 55.8,
        criticalThreshold: 25,
        warningThreshold: 40,
        inverted: true,
        description: 'Blood bank reserve levels',
        color: '#ef4444',
    },
    {
        id: 'ppe_stock',
        name: 'PPE Stock',
        icon: '🥽',
        unit: '% remaining',
        baseUtil: 44.2,
        criticalThreshold: 20,
        warningThreshold: 35,
        inverted: true,
        description: 'Personal protective equipment supply',
        color: '#f59e0b',
    },
    {
        id: 'nursing_staff',
        name: 'Nursing Staff',
        icon: '👩‍⚕️',
        unit: 'utilization %',
        baseUtil: 82.1,
        criticalThreshold: 90,
        warningThreshold: 80,
        inverted: false,
        description: 'Nursing staff workload index',
        color: '#10b981',
    },
]

export function getResourceDefinitions() {
    return RESOURCE_DEFINITIONS
}

function seeded(seed) {
    const x = Math.sin(seed + 1) * 10000
    return x - Math.floor(x)
}

function getStatus(util, resource) {
    if (resource.inverted) {
        if (util <= resource.criticalThreshold) return 'critical'
        if (util <= resource.warningThreshold) return 'warning'
        return 'normal'
    } else {
        if (util >= resource.criticalThreshold) return 'critical'
        if (util >= resource.warningThreshold) return 'warning'
        return 'normal'
    }
}

function getTrend(id) {
    const hour = new Date().getHours()
    const trends = {
        icu_beds: hour < 14 ? 'rising' : hour < 20 ? 'stable' : 'falling',
        oxygen_supply: hour < 18 ? 'stable' : 'falling',
        ventilators: 'rising',
        blood_bank: 'falling',
        ppe_stock: 'stable',
        nursing_staff: hour < 8 ? 'rising' : hour > 20 ? 'falling' : 'stable',
    }
    return trends[id] || 'stable'
}

function hoursToBreachCalc(util, resource, trend) {
    if (resource.inverted) {
        if (trend === 'falling' && util > resource.criticalThreshold) {
            const rate = 0.6
            return Math.round(((util - resource.criticalThreshold) / rate) * 10) / 10
        }
    } else {
        if (trend === 'rising' && util < resource.criticalThreshold) {
            const rate = 0.8
            return Math.round(((resource.criticalThreshold - util) / rate) * 10) / 10
        }
    }
    return null
}

export function generateResourceData() {
    const now = new Date()
    const hourFraction = now.getHours() + now.getMinutes() / 60

    return RESOURCE_DEFINITIONS.map((r, i) => {
        const cycle = Math.sin((hourFraction - 6) * Math.PI / 12) * 3
        const noise = (seeded(i * 137 + Math.floor(Date.now() / 30000)) - 0.5) * 4
        const util = Math.min(100, Math.max(0, Math.round((r.baseUtil + cycle + noise) * 10) / 10))
        const trend = getTrend(r.id)
        const status = getStatus(util, r)

        return {
            ...r,
            utilization: util,
            value: util,
            status,
            trend,
            hours_to_breach: hoursToBreachCalc(util, r, trend),
            last_updated: now.toISOString(),
        }
    })
}

export function generateAlerts() {
    return []
}

export function generate7DayChart() {
    const data = []
    for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const label = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })
        data.push({
            day: label,
            icu_beds: Math.round((75 + Math.sin(i * 0.9) * 8 + (seeded(i * 33) - 0.5) * 6) * 10) / 10,
            oxygen_supply: Math.round((65 - i * 0.5 + (seeded(i * 77) - 0.5) * 4) * 10) / 10,
            ventilators: Math.round((68 + Math.cos(i * 0.7) * 5 + (seeded(i * 51) - 0.5) * 4) * 10) / 10,
            blood_bank: Math.round((60 - i * 0.8 + (seeded(i * 41) - 0.5) * 5) * 10) / 10,
            ppe_stock: Math.round((50 - i * 0.6 + (seeded(i * 63) - 0.5) * 3) * 10) / 10,
            nursing_staff: Math.round((79 + Math.sin(i * 1.2) * 4 + (seeded(i * 29) - 0.5) * 3) * 10) / 10,
        })
    }
    return data
}

export function generateMonthlyTrends() {
    const months = ['Feb \'25', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan \'26']
    return months.map((month, i) => ({
        month,
        icu_beds: Math.round((75 + Math.sin((i - 2) * Math.PI / 6) * 10 + (i >= 10 ? 5 : 0) + (seeded(i * 17) - 0.5) * 4) * 10) / 10,
        oxygen_supply: Math.round((65 + Math.sin((i - 3) * Math.PI / 6) * 8 + (seeded(i * 23) - 0.5) * 3) * 10) / 10,
        ventilators: Math.round((68 + Math.cos((i - 1) * Math.PI / 6) * 9 + (seeded(i * 31) - 0.5) * 4) * 10) / 10,
        blood_bank: Math.round((58 + Math.sin((i) * Math.PI / 6) * 12 + (seeded(i * 43) - 0.5) * 3) * 10) / 10,
        ppe_stock: Math.round((50 + Math.sin((i - 4) * Math.PI / 6) * 15 + (seeded(i * 53) - 0.5) * 4) * 10) / 10,
        nursing_staff: Math.round((80 + Math.sin((i - 2) * Math.PI / 6) * 6 + (seeded(i * 61) - 0.5) * 3) * 10) / 10,
    }))
}

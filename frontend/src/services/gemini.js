const BACKEND_URL = 'http://localhost:8000/api/gemini/chat'

export async function askGemini(message, context = null) {
    try {
        const res = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, context }),
            signal: AbortSignal.timeout(15000),
        })
        if (res.ok) {
            const data = await res.json()
            return data.response
        }
    } catch (err) {
        console.error('Failed to connect to backend AI service:', err)
    }

    return `⚠️ Cannot reach the MedGuard AI backend service. Please ensure the backend is running.`
}

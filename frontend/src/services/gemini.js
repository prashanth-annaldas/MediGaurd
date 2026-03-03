const BACKEND_URL = `${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}/api/gemini/chat`

export async function askGemini(message, context = null, history = []) {
    try {
        const res = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, context, history }),
            signal: AbortSignal.timeout(20000), // Increased timeout for AI
        })

        if (res.ok) {
            const data = await res.json()
            return data.response
        } else {
            const errorText = await res.text().catch(() => 'No error detail available');
            console.error(`Backend AI Error (${res.status}):`, errorText);
            return `⚠️ AI Error: The backend service returned an error (${res.status}). Please check your Gemini API key and backend logs.`;
        }
    } catch (err) {
        console.error('Failed to connect to backend AI service:', err);
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            return `⚠️ AI Timeout: The Gemini service took too long to respond. Please try again in a moment.`;
        }
        return `⚠️ Connection Error: Cannot reach the Gemini backend at ${BACKEND_URL}. Ensure the backend is running and CORS is correctly configured.`;
    }
}

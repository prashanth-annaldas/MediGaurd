import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Calls callback on a configurable interval
 * @param {Function} callback - function to call
 * @param {number} intervalMs - interval in milliseconds (default: 30000)
 * @returns {{ lastRefreshed: Date, isRefreshing: boolean, forceRefresh: Function }}
 */
export function useAutoRefresh(callback, intervalMs = 30000) {
    const [lastRefreshed, setLastRefreshed] = useState(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)
    const callbackRef = useRef(callback)

    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    const doRefresh = useCallback(async () => {
        setIsRefreshing(true)
        try {
            await callbackRef.current()
        } finally {
            setIsRefreshing(false)
            setLastRefreshed(new Date())
        }
    }, [])

    useEffect(() => {
        doRefresh()
        const id = setInterval(doRefresh, intervalMs)
        return () => clearInterval(id)
    }, [doRefresh, intervalMs])

    return { lastRefreshed, isRefreshing, forceRefresh: doRefresh }
}

export default useAutoRefresh

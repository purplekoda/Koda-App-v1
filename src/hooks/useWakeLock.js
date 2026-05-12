'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export default function useWakeLock() {
  const [isActive, setIsActive] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const sentinelRef = useRef(null)
  const intentRef = useRef(false)

  useEffect(() => {
    setIsSupported('wakeLock' in navigator)
  }, [])

  const requestWakeLock = useCallback(async () => {
    try {
      const sentinel = await navigator.wakeLock.request('screen')
      sentinelRef.current = sentinel
      setIsActive(true)
      sentinel.addEventListener('release', () => {
        sentinelRef.current = null
        setIsActive(false)
      })
    } catch {
      setIsActive(false)
      intentRef.current = false
      return false
    }
    return true
  }, [])

  const toggle = useCallback(async () => {
    if (!isSupported) return false

    if (intentRef.current) {
      // Turn off
      intentRef.current = false
      if (sentinelRef.current) {
        await sentinelRef.current.release()
      }
      setIsActive(false)
      return true
    } else {
      // Turn on
      intentRef.current = true
      const success = await requestWakeLock()
      if (!success) {
        return false
      }
      return true
    }
  }, [isSupported, requestWakeLock])

  // Re-acquire on visibility change (user switches back to tab)
  useEffect(() => {
    if (!isSupported) return

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && intentRef.current && !sentinelRef.current) {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isSupported, requestWakeLock])

  // Release on unmount
  useEffect(() => {
    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release()
        sentinelRef.current = null
      }
      intentRef.current = false
    }
  }, [])

  return { isSupported, isActive, toggle }
}

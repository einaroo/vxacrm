import { useState, useEffect, useCallback } from 'react'

export interface Meeting {
  id: string
  title: string
  startTime: string
  endTime: string
  attendees: Array<{
    email: string
    name?: string
    isOrganizer?: boolean
    responseStatus?: string
  }>
}

export interface CalendarResponse {
  success: boolean
  meetings: Meeting[]
  date?: string
  count?: number
  error?: string
}

/**
 * Fetch today's calendar meetings from the API
 */
export async function fetchTodaysMeetings(): Promise<CalendarResponse> {
  try {
    const response = await fetch('/api/calendar')
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return {
        success: false,
        meetings: [],
        error: data.error || `HTTP ${response.status}`,
      }
    }
    
    return await response.json()
  } catch (error) {
    return {
      success: false,
      meetings: [],
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Format a meeting time for display
 */
export function formatMeetingTime(isoString: string): string {
  if (!isoString) return ''
  
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * Check if a meeting is happening now
 */
export function isMeetingNow(meeting: Meeting): boolean {
  const now = new Date()
  const start = new Date(meeting.startTime)
  const end = new Date(meeting.endTime)
  return now >= start && now <= end
}

/**
 * Check if a meeting is coming up (within the next hour)
 */
export function isMeetingSoon(meeting: Meeting, withinMinutes = 60): boolean {
  const now = new Date()
  const start = new Date(meeting.startTime)
  const diffMs = start.getTime() - now.getTime()
  return diffMs > 0 && diffMs <= withinMinutes * 60 * 1000
}

/**
 * React hook for fetching and managing today's meetings
 */
export function useTodaysMeetings(options?: { refreshInterval?: number }) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    const result = await fetchTodaysMeetings()
    
    if (result.success) {
      setMeetings(result.meetings)
    } else {
      setError(result.error || 'Failed to fetch meetings')
    }
    
    setIsLoading(false)
  }, [])
  
  useEffect(() => {
    refresh()
    
    // Set up refresh interval if specified
    if (options?.refreshInterval) {
      const interval = setInterval(refresh, options.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, options?.refreshInterval])
  
  return {
    meetings,
    isLoading,
    error,
    refresh,
  }
}

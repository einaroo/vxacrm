'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { MeetingCard, Meeting } from '@/components/meeting-card'
import { 
  Users, 
  DollarSign,
  UserCheck,
  Eye,
  Loader2,
  ArrowRight,
  Sparkles,
  Calendar,
  PlusCircle,
  TrendingUp,
  X,
} from 'lucide-react'

interface DashboardStats {
  customers: {
    total: number
    byStatus: Record<string, number>
  }
  pipelineValue: number
  recruits: {
    total: number
    byStage: Record<string, number>
  }
  competitors: number
}

interface AskResponse {
  type: 'pipeline' | 'recruitment' | 'meeting' | 'competitor' | 'general'
  title: string
  summary: string
  data?: Record<string, unknown>[]
  suggestions?: string[]
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const quickActions = [
  { label: 'Prep for next meeting', icon: Calendar },
  { label: 'Show pipeline', icon: TrendingUp },
  { label: 'Add customer', icon: PlusCircle },
]

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [meetingsLoading, setMeetingsLoading] = useState(true)
  const [aiQuery, setAiQuery] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [aiResponse, setAiResponse] = useState<AskResponse | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: customers } = await supabase.from('customers').select('status, mrr_value')
        const { data: recruits } = await supabase.from('recruits').select('stage')
        const { count: competitorCount } = await supabase
          .from('competitors')
          .select('*', { count: 'exact', head: true })

        const customersByStatus: Record<string, number> = {}
        let pipelineValue = 0
        
        customers?.forEach((c) => {
          customersByStatus[c.status] = (customersByStatus[c.status] || 0) + 1
          if (c.status === 'won' && c.mrr_value) {
            pipelineValue += c.mrr_value
          }
        })

        const recruitsByStage: Record<string, number> = {}
        recruits?.forEach((r) => {
          recruitsByStage[r.stage] = (recruitsByStage[r.stage] || 0) + 1
        })

        setStats({
          customers: {
            total: customers?.length || 0,
            byStatus: customersByStatus,
          },
          pipelineValue,
          recruits: {
            total: recruits?.length || 0,
            byStage: recruitsByStage,
          },
          competitors: competitorCount || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    async function fetchMeetings() {
      try {
        const res = await fetch('/api/calendar')
        if (res.ok) {
          const data = await res.json()
          // Transform API response to Meeting format
          const transformedMeetings: Meeting[] = (data.meetings || []).map((m: {
            id: string
            title: string
            startTime?: string
            endTime?: string
            time?: string
            attendees: string[] | { email?: string; name: string }[]
          }) => ({
            id: m.id,
            title: m.title,
            startTime: m.startTime ? new Date(m.startTime) : new Date(),
            endTime: m.endTime ? new Date(m.endTime) : new Date(Date.now() + 3600000),
            attendees: m.attendees.map((a: string | { email?: string; name: string }) =>
              typeof a === 'string' ? { name: a } : a
            ),
          }))
          setMeetings(transformedMeetings)
        }
      } catch (error) {
        console.error('Error fetching meetings:', error)
      } finally {
        setMeetingsLoading(false)
      }
    }

    fetchStats()
    fetchMeetings()
  }, [])

  const submitQuery = useCallback(async (query: string) => {
    if (!query.trim() || isAsking) return

    setIsAsking(true)
    setAiError(null)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!res.ok) {
        throw new Error('Failed to get response')
      }

      const data: AskResponse = await res.json()
      setAiResponse(data)
      setAiQuery('')
    } catch (error) {
      console.error('Ask VXA error:', error)
      setAiError('Sorry, I encountered an error. Please try again.')
    } finally {
      setIsAsking(false)
    }
  }, [isAsking])

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitQuery(aiQuery)
  }

  const handleQuickAction = (action: string) => {
    setAiQuery(action)
    submitQuery(action)
  }

  const clearResponse = () => {
    setAiResponse(null)
    setAiError(null)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Greeting and AI Input */}
      <div className="pt-16 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Personalized Greeting */}
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-black">
            {getGreeting()}, Einar
          </h1>
          
          {/* AI Input Field */}
          <form onSubmit={handleAiSubmit} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-5 text-gray-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask anything..."
                disabled={isAsking}
                className="w-full h-14 md:h-16 pl-14 pr-32 text-lg bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button 
                type="submit"
                disabled={isAsking || !aiQuery.trim()}
                className="absolute right-2 h-10 md:h-12 px-6 bg-black hover:bg-gray-800 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAsking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Ask</span>
                    <ArrowRight className="w-4 h-4 sm:ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Quick Action Chips */}
          <div className="flex flex-wrap justify-center gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.label)}
                  disabled={isAsking}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </button>
              )
            })}
          </div>

          {/* Loading State */}
          {isAsking && (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}

          {/* Error State */}
          {aiError && (
            <div className="max-w-xl mx-auto p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {aiError}
            </div>
          )}

          {/* AI Response Card */}
          {aiResponse && !isAsking && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{aiResponse.title}</span>
                  </div>
                  <button
                    onClick={clearResponse}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Summary */}
                <div className="px-5 py-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{aiResponse.summary}</p>
                </div>

                {/* Data Items */}
                {aiResponse.data && aiResponse.data.length > 0 && (
                  <div className="border-t border-gray-100">
                    {aiResponse.data.slice(0, 5).map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 text-sm">
                          {String(item.name || item.company || item.title || 'Item')}
                        </span>
                        {(item.stage ?? item.status ?? item.role) != null && (
                          <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {String(item.stage ?? item.status ?? item.role)}
                          </span>
                        )}
                      </div>
                    ))}
                    {aiResponse.data.length > 5 && (
                      <div className="px-5 py-3 text-xs text-gray-400 bg-gray-50">
                        +{aiResponse.data.length - 5} more
                      </div>
                    )}
                  </div>
                )}

                {/* Suggestions */}
                {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {aiResponse.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleQuickAction(suggestion)}
                          className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-12">
        {/* Stats Grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 bg-white border border-gray-100 rounded-2xl">
                  <div className="flex items-center justify-center h-16">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/customers">
                <div className="group p-6 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                  <p className="text-3xl font-semibold text-black mb-1">{stats.customers.total}</p>
                  <p className="text-sm text-gray-500">Customers</p>
                </div>
              </Link>

              <div className="p-6 bg-white border border-gray-100 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <p className="text-3xl font-semibold text-black mb-1">
                  ${stats.pipelineValue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Won MRR</p>
              </div>

              <Link href="/recruitment">
                <div className="group p-6 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                      <UserCheck className="w-5 h-5 text-gray-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                  <p className="text-3xl font-semibold text-black mb-1">{stats.recruits.total}</p>
                  <p className="text-sm text-gray-500">Candidates</p>
                </div>
              </Link>

              <Link href="/competitors">
                <div className="group p-6 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                      <Eye className="w-5 h-5 text-gray-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                  <p className="text-3xl font-semibold text-black mb-1">{stats.competitors}</p>
                  <p className="text-sm text-gray-500">Competitors</p>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Today's Meetings */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-black">Today&apos;s Meetings</h2>
            <Button variant="ghost" className="text-gray-500 hover:text-black">
              View calendar
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {meetingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          ) : meetings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-1">No meetings scheduled for today</p>
              <p className="text-sm text-gray-400">Your calendar is clear</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

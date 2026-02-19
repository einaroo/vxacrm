'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Radio,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Plus,
  Bell,
  BellOff,
  ExternalLink,
  Check,
  Sparkles,
  Gift,
  Handshake,
  Package,
  MessageCircle,
  Trophy,
  Flame,
} from 'lucide-react'
import { SignalCategory, Signal, SignalEvent } from '@/lib/types'

// Mock data for UI development
const MOCK_SIGNALS: Signal[] = [
  {
    id: '1',
    name: 'Competitor Promo Tracker',
    category: 'competitor-promo',
    description: 'Track promotional offers from key competitors',
    is_active: true,
    target_type: 'competitor',
    target_id: null,
    target_name: 'All Competitors',
    frequency: 'daily',
    last_checked_at: '2026-02-19T08:00:00Z',
    last_triggered_at: '2026-02-18T14:30:00Z',
    trigger_count: 12,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-19T08:00:00Z',
    user_id: null,
  },
  {
    id: '2',
    name: 'Partnership Announcements',
    category: 'competitor-partnership',
    description: 'Monitor competitor partnership news',
    is_active: true,
    target_type: 'competitor',
    target_id: null,
    target_name: 'Jasper, Copy.ai',
    frequency: 'daily',
    last_checked_at: '2026-02-19T08:00:00Z',
    last_triggered_at: null,
    trigger_count: 0,
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-02-19T08:00:00Z',
    user_id: null,
  },
  {
    id: '3',
    name: 'Product Launches',
    category: 'competitor-product',
    description: 'Track new feature and product drops',
    is_active: true,
    target_type: 'competitor',
    target_id: null,
    target_name: 'All Competitors',
    frequency: 'daily',
    last_checked_at: '2026-02-19T08:00:00Z',
    last_triggered_at: '2026-02-17T09:15:00Z',
    trigger_count: 5,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-19T08:00:00Z',
    user_id: null,
  },
  {
    id: '4',
    name: 'Audience Talking Points',
    category: 'audience-talking',
    description: 'Track what your target audience is discussing',
    is_active: false,
    target_type: 'audience',
    target_id: null,
    target_name: 'Marketing Directors',
    frequency: 'daily',
    last_checked_at: null,
    last_triggered_at: null,
    trigger_count: 0,
    created_at: '2026-02-15T10:00:00Z',
    updated_at: '2026-02-15T10:00:00Z',
    user_id: null,
  },
]

const MOCK_EVENTS: SignalEvent[] = [
  {
    id: '1',
    signal_id: '1',
    signal_name: 'Competitor Promo Tracker',
    category: 'competitor-promo',
    title: 'Jasper launched 30% off annual plans',
    description: 'Jasper is running a limited-time promotion offering 30% off annual subscriptions. Campaign spotted on Meta Ads.',
    source_url: 'https://facebook.com/ads/library',
    severity: 'high',
    is_read: false,
    is_actioned: false,
    suggested_action: 'Create counter-offer content',
    created_at: '2026-02-18T14:30:00Z',
  },
  {
    id: '2',
    signal_id: '3',
    signal_name: 'Product Launches',
    category: 'competitor-product',
    title: 'Copy.ai released AI Video Generator',
    description: 'Copy.ai announced a new AI video generation feature for marketing teams. Early reviews suggest quality issues.',
    source_url: 'https://copy.ai/blog',
    severity: 'medium',
    is_read: true,
    is_actioned: false,
    suggested_action: 'Highlight VXA video quality in content',
    created_at: '2026-02-17T09:15:00Z',
  },
  {
    id: '3',
    signal_id: '1',
    signal_name: 'Competitor Promo Tracker',
    category: 'competitor-promo',
    title: 'Canva offering 3 months free for startups',
    description: 'Canva announced a startup program with 3 months free access to Pro features.',
    source_url: 'https://canva.com/startups',
    severity: 'medium',
    is_read: true,
    is_actioned: true,
    suggested_action: null,
    created_at: '2026-02-15T11:00:00Z',
  },
]

const SIGNAL_CATEGORIES: { id: SignalCategory; label: string; icon: typeof Radio; color: string; description: string }[] = [
  { id: 'competitor-promo', label: 'Competitor Promos', icon: Gift, color: 'text-orange-500', description: 'Track promotional offers and discounts' },
  { id: 'competitor-partnership', label: 'Partnerships', icon: Handshake, color: 'text-blue-500', description: 'Monitor partnership announcements' },
  { id: 'competitor-product', label: 'Product Drops', icon: Package, color: 'text-purple-500', description: 'Track new features and launches' },
  { id: 'audience-talking', label: 'Audience Talk', icon: MessageCircle, color: 'text-green-500', description: 'Track what your audience discusses' },
  { id: 'performance-decay', label: 'Performance Decay', icon: TrendingDown, color: 'text-red-500', description: 'Alert when content underperforms' },
  { id: 'performance-winner', label: 'Winners', icon: Trophy, color: 'text-yellow-500', description: 'Identify top performing content' },
  { id: 'trend-match', label: 'Trend Match', icon: Flame, color: 'text-pink-500', description: 'Spot trends that fit your brand' },
]

function getCategoryInfo(category: SignalCategory) {
  return SIGNAL_CATEGORIES.find(c => c.id === category) || SIGNAL_CATEGORIES[0]
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>(MOCK_SIGNALS)
  const [events, setEvents] = useState<SignalEvent[]>(MOCK_EVENTS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<SignalCategory | 'all'>('all')
  const [formData, setFormData] = useState({
    name: '',
    category: 'competitor-promo' as SignalCategory,
    target_name: '',
    frequency: 'daily' as Signal['frequency'],
  })

  const toggleSignal = (id: string) => {
    setSignals(prev => prev.map(s => 
      s.id === id ? { ...s, is_active: !s.is_active } : s
    ))
  }

  const markAsRead = (id: string) => {
    setEvents(prev => prev.map(e =>
      e.id === id ? { ...e, is_read: true } : e
    ))
  }

  const markAsActioned = (id: string) => {
    setEvents(prev => prev.map(e =>
      e.id === id ? { ...e, is_actioned: true, is_read: true } : e
    ))
  }

  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(e => e.category === selectedCategory)

  const unreadCount = events.filter(e => !e.is_read).length
  const activeSignals = signals.filter(s => s.is_active).length

  const handleSave = () => {
    const newSignal: Signal = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      description: null,
      is_active: true,
      target_type: formData.category.startsWith('competitor') ? 'competitor' : 
                   formData.category === 'audience-talking' ? 'audience' : 'trend',
      target_id: null,
      target_name: formData.target_name,
      frequency: formData.frequency,
      last_checked_at: null,
      last_triggered_at: null,
      trigger_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: null,
    }
    setSignals(prev => [newSignal, ...prev])
    setDialogOpen(false)
    setFormData({ name: '', category: 'competitor-promo', target_name: '', frequency: 'daily' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6 text-blue-500" />
            Signals
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {activeSignals} active signals • {unreadCount} unread alerts
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Signal
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Signal Feed */}
        <div className="col-span-8 space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {SIGNAL_CATEGORIES.slice(0, 4).map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${selectedCategory === cat.id ? 'text-white' : cat.color}`} />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Event Cards */}
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Radio className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No signals yet</p>
                  <p className="text-sm mt-1">Configure signals to start receiving alerts</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map(event => {
                const catInfo = getCategoryInfo(event.category)
                const Icon = catInfo.icon
                return (
                  <Card 
                    key={event.id} 
                    className={`transition-all ${
                      !event.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                    } ${event.is_actioned ? 'opacity-60' : ''}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg bg-gray-100 ${catInfo.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={event.severity === 'high' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {event.severity}
                            </Badge>
                            <span className="text-xs text-gray-500">{event.signal_name}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{formatTimeAgo(event.created_at)}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          )}
                          {event.suggested_action && !event.is_actioned && (
                            <div className="mt-3 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                              <div className="flex items-center gap-2 text-sm">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <span className="font-medium text-purple-700">Suggested:</span>
                                <span className="text-purple-600">{event.suggested_action}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            {event.source_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={event.source_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                  View Source
                                </a>
                              </Button>
                            )}
                            {!event.is_actioned && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => markAsActioned(event.id)}
                              >
                                <Check className="w-3.5 h-3.5 mr-1.5" />
                                Mark Done
                              </Button>
                            )}
                            {!event.is_read && (
                              <button 
                                className="text-xs text-gray-500 hover:text-gray-700"
                                onClick={() => markAsRead(event.id)}
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Active Signals */}
        <div className="col-span-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Active Monitors</h2>
          
          {signals.map(signal => {
            const catInfo = getCategoryInfo(signal.category)
            const Icon = catInfo.icon
            return (
              <Card key={signal.id} className={!signal.is_active ? 'opacity-50' : ''}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-1.5 rounded-md bg-gray-100 ${catInfo.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate">{signal.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{signal.target_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {signal.frequency}
                          </Badge>
                          {signal.trigger_count > 0 && (
                            <span className="text-xs text-gray-400">
                              {signal.trigger_count} alerts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSignal(signal.id)}
                      className={`p-1.5 rounded-md transition-colors ${
                        signal.is_active 
                          ? 'text-blue-600 hover:bg-blue-50' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {signal.is_active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Quick Add */}
          <Card className="border-dashed">
            <CardContent className="py-4">
              <button 
                onClick={() => setDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <Plus className="w-4 h-4" />
                Add Signal
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Signal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Signal</DialogTitle>
            <DialogDescription>
              Set up automated monitoring for important market events.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Signal Name</Label>
              <Input
                id="name"
                placeholder="e.g., Track Jasper promos"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Signal Type</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v as SignalCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNAL_CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target">What to Monitor</Label>
              <Input
                id="target"
                placeholder="e.g., Jasper, Copy.ai, Canva"
                value={formData.target_name}
                onChange={(e) => setFormData({ ...formData, target_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Check Frequency</Label>
              <Select 
                value={formData.frequency} 
                onValueChange={(v) => setFormData({ ...formData, frequency: v as Signal['frequency'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              Create Signal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

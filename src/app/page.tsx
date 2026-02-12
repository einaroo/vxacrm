'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Target, 
  UserPlus, 
  MessageSquare,
  DollarSign,
  TrendingUp,
  UserCheck,
  Eye,
  Loader2
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

const navigationCards = [
  {
    href: '/customers',
    title: 'Customers',
    description: 'Track sales pipeline from lead to won',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    href: '/competitors',
    title: 'Competitors',
    description: 'Monitor market competition',
    icon: Target,
    color: 'bg-orange-500',
  },
  {
    href: '/recruitment',
    title: 'Recruitment',
    description: 'Manage hiring pipeline',
    icon: UserPlus,
    color: 'bg-green-500',
  },
  {
    href: '/interviews',
    title: 'Interviews',
    description: 'Customer interview insights',
    icon: MessageSquare,
    color: 'bg-purple-500',
  },
]

const customerStatuses = [
  { id: 'lead', label: 'Leads', color: 'bg-gray-400' },
  { id: 'in-contact', label: 'In Contact', color: 'bg-blue-500' },
  { id: 'negotiating', label: 'Negotiating', color: 'bg-yellow-500' },
  { id: 'won', label: 'Won', color: 'bg-green-500' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500' },
]

const recruitStages = [
  { id: 'lead', label: 'Lead', color: 'bg-gray-400' },
  { id: 'screen', label: 'Screen', color: 'bg-blue-500' },
  { id: 'interview', label: 'Interview', color: 'bg-yellow-500' },
  { id: 'offer', label: 'Offer', color: 'bg-purple-500' },
  { id: 'hired', label: 'Hired', color: 'bg-green-500' },
]

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch customers
        const { data: customers } = await supabase.from('customers').select('status, mrr_value')
        
        // Fetch recruits
        const { data: recruits } = await supabase.from('recruits').select('stage')
        
        // Fetch competitors count
        const { count: competitorCount } = await supabase
          .from('competitors')
          .select('*', { count: 'exact', head: true })

        // Calculate customer stats
        const customersByStatus: Record<string, number> = {}
        let pipelineValue = 0
        
        customers?.forEach((c) => {
          customersByStatus[c.status] = (customersByStatus[c.status] || 0) + 1
          if (c.status === 'won' && c.mrr_value) {
            pipelineValue += c.mrr_value
          }
        })

        // Calculate recruit stats
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

    fetchStats()
  }, [])

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome to VXA Labs CRM</h1>
        <p className="text-gray-600">Manage your sales, recruitment, and competitive intelligence.</p>
      </div>

      {/* Stats Overview */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            </Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Customers */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{stats.customers.total}</p>
              </div>
            </div>
          </Card>

          {/* Pipeline Value */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Won MRR</p>
                <p className="text-2xl font-bold">${stats.pipelineValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Recruitment */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Candidates</p>
                <p className="text-2xl font-bold">{stats.recruits.total}</p>
              </div>
            </div>
          </Card>

          {/* Competitors */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Competitors</p>
                <p className="text-2xl font-bold">{stats.competitors}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pipeline Breakdown */}
      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Pipeline */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-lg">Sales Pipeline</h2>
            </div>
            <div className="space-y-3">
              {customerStatuses.map((status) => {
                const count = stats.customers.byStatus[status.id] || 0
                const percentage = stats.customers.total > 0 
                  ? Math.round((count / stats.customers.total) * 100) 
                  : 0
                return (
                  <div key={status.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    <span className="text-sm text-gray-600 w-24">{status.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${status.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs min-w-[2.5rem] justify-center">
                      {count}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Recruitment Pipeline */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-lg">Recruitment Pipeline</h2>
            </div>
            <div className="space-y-3">
              {recruitStages.map((stage) => {
                const count = stats.recruits.byStage[stage.id] || 0
                const percentage = stats.recruits.total > 0 
                  ? Math.round((count / stats.recruits.total) * 100) 
                  : 0
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="text-sm text-gray-600 w-24">{stage.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${stage.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs min-w-[2.5rem] justify-center">
                      {count}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Cards */}
      <div>
        <h2 className="font-semibold text-lg mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {navigationCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.href} href={card.href}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{card.title}</h3>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

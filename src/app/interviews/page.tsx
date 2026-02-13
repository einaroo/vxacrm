'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Building2, Trash2, MessageSquare, Lightbulb, Mail, User } from 'lucide-react'

interface Expert {
  id: string
  customer_name: string | null  // Used as expert name
  date: string | null  // Used as contact date
  notes: string | null  // Used for insights/notes
  company?: string | null
  expertise_area?: string | null
  contact_email?: string | null
  status?: string | null
  created_at: string
  questions?: ExpertInsight[]
}

interface ExpertInsight {
  id: string
  interview_id: string
  question: string
  answer: string | null
}

const STATUS_OPTIONS = [
  { value: 'identified', label: 'Identified', color: 'bg-gray-100 text-gray-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { value: 'engaged', label: 'Engaged', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700' },
]

const EXPERTISE_AREAS = [
  'AI/ML',
  'Product Strategy',
  'Go-to-Market',
  'Engineering',
  'Design',
  'Sales',
  'Marketing',
  'Operations',
  'Finance',
  'Legal',
  'Other',
]

function getStatusBadge(status: string | null | undefined) {
  const statusOption = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  return (
    <Badge className={statusOption.color}>
      {statusOption.label}
    </Badge>
  )
}

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null)
  const [formData, setFormData] = useState({
    customer_name: '',
    company: '',
    expertise_area: '',
    contact_email: '',
    status: 'identified',
    date: '',
    notes: '',
  })

  const fetchExperts = useCallback(async () => {
    const { data: expertsData } = await supabase
      .from('interviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (expertsData) {
      // Fetch insights (questions) for each expert
      const expertsWithInsights = await Promise.all(
        expertsData.map(async (expert) => {
          const { data: questions } = await supabase
            .from('interview_questions')
            .select('*')
            .eq('interview_id', expert.id)
          return { ...expert, questions: questions || [] }
        })
      )
      setExperts(expertsWithInsights)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchExperts()
  }, [fetchExperts])

  const filteredExperts = experts.filter((expert) => {
    const query = searchQuery.toLowerCase()
    const matchesName = expert.customer_name?.toLowerCase().includes(query)
    const matchesCompany = expert.company?.toLowerCase().includes(query)
    const matchesExpertise = expert.expertise_area?.toLowerCase().includes(query)
    const matchesNotes = expert.notes?.toLowerCase().includes(query)
    const matchesInsights = expert.questions?.some(
      (q) =>
        q.question.toLowerCase().includes(query) ||
        q.answer?.toLowerCase().includes(query)
    )
    return matchesName || matchesCompany || matchesExpertise || matchesNotes || matchesInsights
  })

  const openNewDialog = () => {
    setEditingExpert(null)
    setFormData({
      customer_name: '',
      company: '',
      expertise_area: '',
      contact_email: '',
      status: 'identified',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (expert: Expert) => {
    setEditingExpert(expert)
    setFormData({
      customer_name: expert.customer_name || '',
      company: expert.company || '',
      expertise_area: expert.expertise_area || '',
      contact_email: expert.contact_email || '',
      status: expert.status || 'identified',
      date: expert.date || '',
      notes: expert.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      customer_name: formData.customer_name || null,
      company: formData.company || null,
      expertise_area: formData.expertise_area || null,
      contact_email: formData.contact_email || null,
      status: formData.status || null,
      date: formData.date || null,
      notes: formData.notes || null,
      updated_at: new Date().toISOString(),
    }

    if (editingExpert) {
      await supabase.from('interviews').update(payload).eq('id', editingExpert.id)
    } else {
      await supabase.from('interviews').insert(payload)
    }

    setDialogOpen(false)
    fetchExperts()
  }

  const handleDelete = async () => {
    if (!editingExpert) return
    // Delete insights first
    await supabase.from('interview_questions').delete().eq('interview_id', editingExpert.id)
    await supabase.from('interviews').delete().eq('id', editingExpert.id)
    setDialogOpen(false)
    fetchExperts()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Experts</h1>
          <p className="text-gray-600 text-sm mt-1">
            {experts.length} thought leader{experts.length !== 1 ? 's' : ''} and domain expert{experts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expert
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search experts, companies, expertise, or insights..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredExperts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No experts match your search' : 'No experts yet. Add thought leaders and domain experts to collect insights.'}
          </div>
        ) : (
          filteredExperts.map((expert) => (
            <Card
              key={expert.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEditDialog(expert)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    {expert.customer_name && (
                      <div className="flex items-center gap-1 font-medium">
                        <User className="w-4 h-4 text-gray-400" />
                        {expert.customer_name}
                      </div>
                    )}
                    {expert.company && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Building2 className="w-4 h-4" />
                        {expert.company}
                      </div>
                    )}
                    {expert.expertise_area && (
                      <Badge variant="outline" className="font-normal">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        {expert.expertise_area}
                      </Badge>
                    )}
                    {getStatusBadge(expert.status)}
                  </div>
                  
                  {expert.contact_email && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Mail className="w-3 h-3" />
                      {expert.contact_email}
                    </div>
                  )}
                  
                  {expert.notes && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {expert.notes}
                    </p>
                  )}
                  
                  {expert.questions && expert.questions.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MessageSquare className="w-3 h-3" />
                        {expert.questions.length} insight{expert.questions.length !== 1 ? 's' : ''} captured
                      </div>
                      <div className="space-y-2">
                        {expert.questions.slice(0, 2).map((q) => (
                          <div key={q.id} className="text-sm bg-gray-50 p-2 rounded">
                            <span className="font-medium text-gray-700">Q: </span>
                            <span className="text-gray-600">{q.question}</span>
                            {q.answer && (
                              <>
                                <br />
                                <span className="font-medium text-gray-700">A: </span>
                                <span className="text-gray-600">{q.answer}</span>
                              </>
                            )}
                          </div>
                        ))}
                        {expert.questions.length > 2 && (
                          <p className="text-xs text-gray-400">
                            +{expert.questions.length - 2} more insights
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingExpert ? 'Edit Expert' : 'Add Expert'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_name">Name</Label>
              <Input
                id="customer_name"
                placeholder="Expert's full name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Company or organization"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expertise_area">Expertise Area</Label>
                <Select
                  value={formData.expertise_area}
                  onValueChange={(value) => setFormData({ ...formData, expertise_area: value })}
                >
                  <SelectTrigger id="expertise_area">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERTISE_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Last Contact Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes / Insights</Label>
              <Textarea
                id="notes"
                placeholder="Key insights, expertise details, or notes from conversations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingExpert && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

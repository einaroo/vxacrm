'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { Recruit } from '@/lib/types'
import { KanbanBoard } from '@/components/kanban-board'
import { SearchBar } from '@/components/search-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Mail, Briefcase, Code, Calendar, RefreshCw } from 'lucide-react'
import { toast } from '@/components/ui/toast'

const COLUMNS = [
  { id: 'lead', title: 'Lead', color: 'bg-gray-400' },
  { id: 'screen', title: 'Screen', color: 'bg-blue-500' },
  { id: 'interview', title: 'Interview', color: 'bg-yellow-500' },
  { id: 'offer', title: 'Offer', color: 'bg-purple-500' },
  { id: 'hired', title: 'Hired', color: 'bg-green-500' },
]

export default function RecruitmentPage() {
  const [recruits, setRecruits] = useState<Recruit[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecruit, setEditingRecruit] = useState<Recruit | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    role: '',
    priority: '',
    technical_role: false,
    comments: '',
    stage: 'lead' as Recruit['stage'],
  })

  const fetchRecruits = useCallback(async () => {
    const { data } = await supabase
      .from('recruits')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setRecruits(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRecruits()
  }, [fetchRecruits])

  const handleCalendarSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/calendar-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromDate: '2025-01-01',
          toDate: new Date().toISOString().split('T')[0],
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.added > 0) {
          toast({
            title: 'Calendar Sync Complete',
            description: `Added ${data.added} new candidates from ${data.totalInterviewEvents} interview events.`,
            variant: 'success',
          })
          fetchRecruits()
        } else {
          toast({
            title: 'No New Candidates',
            description: `Found ${data.totalInterviewEvents} interview events, but no new candidates to add.`,
            variant: 'info',
          })
        }
      } else {
        toast({
          title: 'Sync Failed',
          description: data.error || 'Failed to sync calendar events.',
          variant: 'error',
        })
      }
    } catch (error) {
      console.error('Calendar sync error:', error)
      toast({
        title: 'Sync Failed',
        description: 'Failed to connect to calendar sync API.',
        variant: 'error',
      })
    } finally {
      setSyncing(false)
    }
  }

  // Filter recruits based on search query
  const filteredRecruits = useMemo(() => {
    if (!searchQuery.trim()) return recruits
    
    const query = searchQuery.toLowerCase()
    return recruits.filter((r) => 
      r.name?.toLowerCase().includes(query) ||
      r.email?.toLowerCase().includes(query) ||
      r.position?.toLowerCase().includes(query) ||
      r.role?.toLowerCase().includes(query)
    )
  }, [recruits, searchQuery])

  const columns = COLUMNS.map((col) => ({
    ...col,
    items: filteredRecruits.filter((r) => r.stage === col.id),
  }))

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const recruitId = result.draggableId
    const newStage = result.destination.droppableId as Recruit['stage']

    setRecruits((prev) =>
      prev.map((r) => (r.id === recruitId ? { ...r, stage: newStage } : r))
    )

    await supabase
      .from('recruits')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', recruitId)
  }

  const openNewDialog = () => {
    setEditingRecruit(null)
    setFormData({
      name: '',
      email: '',
      position: '',
      role: '',
      priority: '',
      technical_role: false,
      comments: '',
      stage: 'lead',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (recruit: Recruit) => {
    setEditingRecruit(recruit)
    setFormData({
      name: recruit.name || '',
      email: recruit.email || '',
      position: recruit.position || '',
      role: recruit.role || '',
      priority: recruit.priority || '',
      technical_role: recruit.technical_role || false,
      comments: recruit.comments || '',
      stage: recruit.stage,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      name: formData.name,
      email: formData.email || null,
      position: formData.position || null,
      role: formData.role || null,
      priority: formData.priority || null,
      technical_role: formData.technical_role,
      comments: formData.comments || null,
      stage: formData.stage,
      updated_at: new Date().toISOString(),
    }

    if (editingRecruit) {
      await supabase.from('recruits').update(payload).eq('id', editingRecruit.id)
    } else {
      await supabase.from('recruits').insert(payload)
    }

    setDialogOpen(false)
    fetchRecruits()
  }

  const handleDelete = async () => {
    if (!editingRecruit) return
    await supabase.from('recruits').delete().eq('id', editingRecruit.id)
    setDialogOpen(false)
    fetchRecruits()
  }

  const renderCard = (recruit: Recruit) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="font-medium text-sm">{recruit.name}</div>
        {recruit.technical_role && (
          <Code className="w-3 h-3 text-blue-500" />
        )}
      </div>
      {recruit.position && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Briefcase className="w-3 h-3" />
          {recruit.position}
        </div>
      )}
      {recruit.email && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Mail className="w-3 h-3" />
          {recruit.email}
        </div>
      )}
      <div className="flex gap-1 flex-wrap">
        {recruit.role && (
          <Badge variant="secondary" className="text-xs">
            {recruit.role}
          </Badge>
        )}
        {recruit.priority && (
          <Badge 
            variant={recruit.priority === 'high' ? 'destructive' : 'outline'} 
            className="text-xs"
          >
            {recruit.priority}
          </Badge>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Recruitment</h1>
          <p className="text-gray-600 text-sm mt-1">
            {recruits.length} total • {columns[4].items.length} hired
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCalendarSync} disabled={syncing}>
            {syncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            {syncing ? 'Syncing...' : 'Sync from Calendar'}
          </Button>
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      </div>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search by name, email, or position..."
        className="mb-6 max-w-md"
      />

      {searchQuery && filteredRecruits.length !== recruits.length && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {filteredRecruits.length} of {recruits.length} candidates
        </p>
      )}

      <KanbanBoard
        columns={columns}
        onDragEnd={handleDragEnd}
        renderCard={renderCard}
        onCardClick={openEditDialog}
        loading={loading}
        emptyMessage="Add your first candidate to start building your hiring pipeline."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRecruit ? 'Edit Candidate' : 'Add Candidate'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Senior Engineer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role/Team</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Backend, Design"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                placeholder="e.g., high, medium, low"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="technical_role"
                checked={formData.technical_role}
                onChange={(e) => setFormData({ ...formData, technical_role: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="technical_role">Technical Role</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingRecruit && (
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

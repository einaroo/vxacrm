'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { Competitor } from '@/lib/types'
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
import { Plus, Trash2, Globe, Percent, Sparkles } from 'lucide-react'

const COLUMNS = [
  { id: 'watch', title: 'Watch', color: 'bg-gray-400' },
  { id: 'traction', title: 'Traction', color: 'bg-yellow-500' },
  { id: 'bigplayer', title: 'Big Player', color: 'bg-red-500' },
]

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    company: '',
    market_share: '',
    pricing: '',
    core_feature: '',
    comment: '',
    status: 'watch' as Competitor['status'],
  })

  const fetchCompetitors = useCallback(async () => {
    const { data } = await supabase
      .from('competitors')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setCompetitors(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCompetitors()
  }, [fetchCompetitors])

  // Filter competitors based on search query
  const filteredCompetitors = useMemo(() => {
    if (!searchQuery.trim()) return competitors
    
    const query = searchQuery.toLowerCase()
    return competitors.filter((c) => 
      c.name?.toLowerCase().includes(query) ||
      c.company?.toLowerCase().includes(query) ||
      c.website?.toLowerCase().includes(query) ||
      c.core_feature?.toLowerCase().includes(query)
    )
  }, [competitors, searchQuery])

  const columns = COLUMNS.map((col) => ({
    ...col,
    items: filteredCompetitors.filter((c) => c.status === col.id),
  }))

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const competitorId = result.draggableId
    const newStatus = result.destination.droppableId as Competitor['status']

    setCompetitors((prev) =>
      prev.map((c) => (c.id === competitorId ? { ...c, status: newStatus } : c))
    )

    await supabase
      .from('competitors')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', competitorId)
  }

  const openNewDialog = () => {
    setEditingCompetitor(null)
    setFormData({
      name: '',
      website: '',
      company: '',
      market_share: '',
      pricing: '',
      core_feature: '',
      comment: '',
      status: 'watch',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (competitor: Competitor) => {
    setEditingCompetitor(competitor)
    setFormData({
      name: competitor.name || '',
      website: competitor.website || '',
      company: competitor.company || '',
      market_share: competitor.market_share?.toString() || '',
      pricing: competitor.pricing || '',
      core_feature: competitor.core_feature || '',
      comment: competitor.comment || '',
      status: competitor.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      name: formData.name,
      website: formData.website || null,
      company: formData.company || null,
      market_share: formData.market_share ? parseFloat(formData.market_share) : null,
      pricing: formData.pricing || null,
      core_feature: formData.core_feature || null,
      comment: formData.comment || null,
      status: formData.status,
      updated_at: new Date().toISOString(),
    }

    if (editingCompetitor) {
      await supabase.from('competitors').update(payload).eq('id', editingCompetitor.id)
    } else {
      await supabase.from('competitors').insert(payload)
    }

    setDialogOpen(false)
    fetchCompetitors()
  }

  const handleDelete = async () => {
    if (!editingCompetitor) return
    await supabase.from('competitors').delete().eq('id', editingCompetitor.id)
    setDialogOpen(false)
    fetchCompetitors()
  }

  const renderCard = (competitor: Competitor) => (
    <div className="space-y-2">
      <div className="font-medium text-sm">{competitor.name}</div>
      {competitor.website && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Globe className="w-3 h-3" />
          <a 
            href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {competitor.website}
          </a>
        </div>
      )}
      {competitor.core_feature && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Sparkles className="w-3 h-3" />
          {competitor.core_feature}
        </div>
      )}
      <div className="flex gap-1 flex-wrap">
        {competitor.market_share && (
          <Badge variant="secondary" className="text-xs">
            <Percent className="w-3 h-3 mr-1" />
            {competitor.market_share}%
          </Badge>
        )}
        {competitor.pricing && (
          <Badge variant="outline" className="text-xs">
            {competitor.pricing}
          </Badge>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Competitors</h1>
          <p className="text-gray-600 text-sm mt-1">
            {competitors.length} total • {columns[2].items.length} big players
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Competitor
        </Button>
      </div>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search by name, company, or website..."
        className="mb-6 max-w-md"
      />

      {searchQuery && filteredCompetitors.length !== competitors.length && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {filteredCompetitors.length} of {competitors.length} competitors
        </p>
      )}

      <KanbanBoard
        columns={columns}
        onDragEnd={handleDragEnd}
        renderCard={renderCard}
        onCardClick={openEditDialog}
        loading={loading}
        emptyMessage="Add competitors to track your market landscape."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCompetitor ? 'Edit Competitor' : 'Add Competitor'}
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
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="market_share">Market Share (%)</Label>
              <Input
                id="market_share"
                type="number"
                value={formData.market_share}
                onChange={(e) => setFormData({ ...formData, market_share: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pricing">Pricing</Label>
              <Input
                id="pricing"
                value={formData.pricing}
                onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="core_feature">Core Feature</Label>
              <Input
                id="core_feature"
                value={formData.core_feature}
                onChange={(e) => setFormData({ ...formData, core_feature: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comment">Notes</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingCompetitor && (
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

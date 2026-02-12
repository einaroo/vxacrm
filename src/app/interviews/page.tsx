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
import { Plus, Search, Calendar, User, Trash2, MessageSquare } from 'lucide-react'

interface Interview {
  id: string
  customer_name: string | null
  date: string | null
  notes: string | null
  created_at: string
  questions?: InterviewQuestion[]
}

interface InterviewQuestion {
  id: string
  interview_id: string
  question: string
  answer: string | null
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [formData, setFormData] = useState({
    customer_name: '',
    date: '',
    notes: '',
  })

  const fetchInterviews = useCallback(async () => {
    const { data: interviewsData } = await supabase
      .from('interviews')
      .select('*')
      .order('date', { ascending: false })

    if (interviewsData) {
      // Fetch questions for each interview
      const interviewsWithQuestions = await Promise.all(
        interviewsData.map(async (interview) => {
          const { data: questions } = await supabase
            .from('interview_questions')
            .select('*')
            .eq('interview_id', interview.id)
          return { ...interview, questions: questions || [] }
        })
      )
      setInterviews(interviewsWithQuestions)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  const filteredInterviews = interviews.filter((interview) => {
    const query = searchQuery.toLowerCase()
    const matchesName = interview.customer_name?.toLowerCase().includes(query)
    const matchesNotes = interview.notes?.toLowerCase().includes(query)
    const matchesQuestions = interview.questions?.some(
      (q) =>
        q.question.toLowerCase().includes(query) ||
        q.answer?.toLowerCase().includes(query)
    )
    return matchesName || matchesNotes || matchesQuestions
  })

  const openNewDialog = () => {
    setEditingInterview(null)
    setFormData({
      customer_name: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (interview: Interview) => {
    setEditingInterview(interview)
    setFormData({
      customer_name: interview.customer_name || '',
      date: interview.date || '',
      notes: interview.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      customer_name: formData.customer_name || null,
      date: formData.date || null,
      notes: formData.notes || null,
      updated_at: new Date().toISOString(),
    }

    if (editingInterview) {
      await supabase.from('interviews').update(payload).eq('id', editingInterview.id)
    } else {
      await supabase.from('interviews').insert(payload)
    }

    setDialogOpen(false)
    fetchInterviews()
  }

  const handleDelete = async () => {
    if (!editingInterview) return
    // Delete questions first
    await supabase.from('interview_questions').delete().eq('interview_id', editingInterview.id)
    await supabase.from('interviews').delete().eq('id', editingInterview.id)
    setDialogOpen(false)
    fetchInterviews()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Interviews</h1>
          <p className="text-gray-600 text-sm mt-1">
            {interviews.length} interviews recorded
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Interview
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search interviews, notes, or Q&A..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredInterviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No interviews match your search' : 'No interviews yet'}
          </div>
        ) : (
          filteredInterviews.map((interview) => (
            <Card
              key={interview.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEditDialog(interview)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    {interview.customer_name && (
                      <div className="flex items-center gap-1 font-medium">
                        <User className="w-4 h-4 text-gray-400" />
                        {interview.customer_name}
                      </div>
                    )}
                    {interview.date && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(interview.date).toLocaleDateString()}
                      </div>
                    )}
                    {interview.questions && interview.questions.length > 0 && (
                      <Badge variant="secondary">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {interview.questions.length} Q&A
                      </Badge>
                    )}
                  </div>
                  {interview.notes && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {interview.notes}
                    </p>
                  )}
                  {interview.questions && interview.questions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {interview.questions.slice(0, 2).map((q) => (
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
                      {interview.questions.length > 2 && (
                        <p className="text-xs text-gray-400">
                          +{interview.questions.length - 2} more questions
                        </p>
                      )}
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
              {editingInterview ? 'Edit Interview' : 'Add Interview'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingInterview && (
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

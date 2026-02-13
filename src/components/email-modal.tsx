'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { Loader2, Send, Sparkles, RefreshCw } from 'lucide-react'
import { Customer } from '@/lib/types'

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
}

export function EmailModal({ isOpen, onClose, customer }: EmailModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [draftContext, setDraftContext] = useState('')

  // Generate AI draft when modal opens
  useEffect(() => {
    if (isOpen && customer?.id) {
      generateDraft()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customer?.id])

  const generateDraft = async (additionalContext?: string) => {
    if (!customer?.id) return

    setLoading(true)
    try {
      const res = await fetch('/api/email/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          context: additionalContext || draftContext,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate draft')
      }

      const data = await res.json()
      setSubject(data.draft.subject)
      setBody(data.draft.body)
    } catch (error) {
      console.error('Draft error:', error)
      toast({
        title: 'Draft Failed',
        description: 'Could not generate AI draft. Please write manually.',
        variant: 'error',
      })
      // Set default values
      setSubject(`Following up - VXA for ${customer?.company || customer?.name}`)
      setBody(`Hi${customer?.name ? ` ${customer.name.split(' ')[0]}` : ''},\n\nI wanted to reach out about VXA...\n\nBest,\nEinar`)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!customer?.email) {
      toast({
        title: 'No Email',
        description: 'This customer has no email address.',
        variant: 'error',
      })
      return
    }

    if (!subject.trim() || !body.trim()) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in both subject and body.',
        variant: 'error',
      })
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customer.email,
          subject,
          body,
          customerId: customer.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send')
      }

      toast({
        title: 'Email Sent! 🎉',
        description: `Sent to ${customer.email}`,
        variant: 'success',
      })
      
      onClose()
      // Reset form
      setSubject('')
      setBody('')
      setDraftContext('')
    } catch (error) {
      console.error('Send error:', error)
      toast({
        title: 'Send Failed',
        description: error instanceof Error ? error.message : 'Could not send email',
        variant: 'error',
      })
    } finally {
      setSending(false)
    }
  }

  const handleRegenerate = () => {
    generateDraft(draftContext)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Email {customer?.name || 'Customer'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* To field (read-only) */}
          <div className="grid gap-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={customer?.email || 'No email address'}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* AI Context input */}
          <div className="grid gap-2">
            <Label htmlFor="context" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              AI Context (optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="context"
                value={draftContext}
                onChange={(e) => setDraftContext(e.target.value)}
                placeholder="e.g., 'follow up on pricing discussion' or 'check in after demo'"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleRegenerate}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Subject */}
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            {loading ? (
              <div className="h-10 bg-gray-50 rounded-md flex items-center px-3">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-400">Generating...</span>
              </div>
            ) : (
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            )}
          </div>

          {/* Body */}
          <div className="grid gap-2">
            <Label htmlFor="body">Message</Label>
            {loading ? (
              <div className="h-40 bg-gray-50 rounded-md flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">AI is drafting your email...</span>
              </div>
            ) : (
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body..."
                rows={8}
                className="resize-none"
              />
            )}
          </div>

          {/* Customer info badge */}
          {customer && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-2">
              <span className="font-medium">{customer.company || 'Unknown company'}</span>
              <span className="mx-2">•</span>
              <span className="capitalize">{customer.status}</span>
              {customer.mrr_value && (
                <>
                  <span className="mx-2">•</span>
                  <span>${customer.mrr_value.toLocaleString()}/mo</span>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || loading || !customer?.email}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

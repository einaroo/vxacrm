'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { Customer } from '@/lib/types'
import { KanbanBoard } from '@/components/kanban-board'
import { SearchBar } from '@/components/search-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, DollarSign, Building, Mail, RefreshCw, Send, Link2 } from 'lucide-react'
import { EmailModal } from '@/components/email-modal'

const COLUMNS = [
  { id: 'lead', title: 'Lead', color: 'bg-gray-400' },
  { id: 'in-contact', title: 'In Contact', color: 'bg-blue-500' },
  { id: 'negotiating', title: 'Negotiating', color: 'bg-yellow-500' },
  { id: 'won', title: 'Won', color: 'bg-green-500' },
  { id: 'lost', title: 'Lost', color: 'bg-red-500' },
]

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    mrr_value: '',
    status: 'lead' as Customer['status'],
  })
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailCustomer, setEmailCustomer] = useState<Customer | null>(null)

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setCustomers(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers
    
    const query = searchQuery.toLowerCase()
    return customers.filter((c) => 
      c.name?.toLowerCase().includes(query) ||
      c.company?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    )
  }, [customers, searchQuery])

  const columns = COLUMNS.map((col) => ({
    ...col,
    items: filteredCustomers.filter((c) => c.status === col.id),
  }))

  const totalMRR = customers
    .filter((c) => c.status === 'won')
    .reduce((sum, c) => sum + (c.mrr_value || 0), 0)

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const customerId = result.draggableId
    const newStatus = result.destination.droppableId as Customer['status']

    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, status: newStatus } : c))
    )

    await supabase
      .from('customers')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', customerId)
  }

  const openNewDialog = () => {
    setEditingCustomer(null)
    setFormData({ name: '', email: '', company: '', mrr_value: '', status: 'lead' })
    setDialogOpen(true)
  }

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      company: customer.company || '',
      mrr_value: customer.mrr_value?.toString() || '',
      status: customer.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      name: formData.name,
      email: formData.email,
      company: formData.company,
      mrr_value: formData.mrr_value ? parseFloat(formData.mrr_value) : null,
      status: formData.status,
      updated_at: new Date().toISOString(),
    }

    if (editingCustomer) {
      await supabase.from('customers').update(payload).eq('id', editingCustomer.id)
    } else {
      await supabase.from('customers').insert(payload)
    }

    setDialogOpen(false)
    fetchCustomers()
  }

  const handleDelete = async () => {
    if (!editingCustomer) return
    await supabase.from('customers').delete().eq('id', editingCustomer.id)
    setDialogOpen(false)
    fetchCustomers()
  }

  const openEmailModal = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setEmailCustomer(customer)
    setEmailModalOpen(true)
  }

  const copyBookingLink = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation()
    const bookingUrl = `${window.location.origin}/booking/${customer.id}`
    navigator.clipboard.writeText(bookingUrl)
    toast({
      title: 'Booking Link Copied! 📋',
      description: `Link for ${customer.name || customer.company} copied to clipboard`,
      variant: 'success',
    })
  }

  const [syncing, setSyncing] = useState(false)

  const handleGmailSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/gmail-sync', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      if (data.added > 0) {
        toast({
          title: 'Gmail Sync Complete',
          description: `Added ${data.added} new contacts as leads.`,
          variant: 'success',
        })
        fetchCustomers() // Refresh the list
      } else {
        toast({
          title: 'Gmail Sync Complete',
          description: data.message || 'No new contacts to add.',
          variant: 'info',
        })
      }
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync Gmail contacts.',
        variant: 'error',
      })
    } finally {
      setSyncing(false)
    }
  }

  const renderCard = (customer: Customer) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">{customer.name}</div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => copyBookingLink(customer, e)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Copy booking link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
          {customer.email && (
            <button
              onClick={(e) => openEmailModal(customer, e)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Send email"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {customer.company && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Building className="w-3 h-3" />
          {customer.company}
        </div>
      )}
      {customer.email && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Mail className="w-3 h-3" />
          {customer.email}
        </div>
      )}
      {customer.mrr_value && (
        <Badge variant="secondary" className="text-xs">
          <DollarSign className="w-3 h-3 mr-1" />
          {customer.mrr_value.toLocaleString()}/mo
        </Badge>
      )}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-gray-600 text-sm mt-1">
            {customers.length} total • ${totalMRR.toLocaleString()} MRR from won deals
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGmailSync} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Gmail'}
          </Button>
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search by name, company, or email..."
        className="mb-6 max-w-md"
      />

      {searchQuery && filteredCustomers.length !== customers.length && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      )}

      <KanbanBoard
        columns={columns}
        onDragEnd={handleDragEnd}
        renderCard={renderCard}
        onCardClick={openEditDialog}
        loading={loading}
        emptyMessage="Add your first customer to start tracking your sales pipeline."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mrr">MRR Value ($)</Label>
              <Input
                id="mrr"
                type="number"
                value={formData.mrr_value}
                onChange={(e) => setFormData({ ...formData, mrr_value: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingCustomer && (
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

      {/* Email Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false)
          setEmailCustomer(null)
        }}
        customer={emailCustomer}
      />
    </div>
  )
}

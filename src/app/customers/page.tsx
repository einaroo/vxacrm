'use client'

import { useEffect, useState, useCallback } from 'react'
import { DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { Customer } from '@/lib/types'
import { KanbanBoard } from '@/components/kanban-board'
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
import { Plus, Trash2, DollarSign, Building, Mail } from 'lucide-react'

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    mrr_value: '',
    status: 'lead' as Customer['status'],
  })

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

  const columns = COLUMNS.map((col) => ({
    ...col,
    items: customers.filter((c) => c.status === col.id),
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

  const renderCard = (customer: Customer) => (
    <div className="space-y-2">
      <div className="font-medium text-sm">{customer.name}</div>
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-gray-600 text-sm mt-1">
            {customers.length} total • ${totalMRR.toLocaleString()} MRR from won deals
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <KanbanBoard
        columns={columns}
        onDragEnd={handleDragEnd}
        renderCard={renderCard}
        onCardClick={openEditDialog}
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
    </div>
  )
}

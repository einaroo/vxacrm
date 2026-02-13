'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Video,
  User,
  Building,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TimeSlot {
  date: string
  time: string
  startIso: string
  endIso: string
  available: boolean
}

interface CustomerInfo {
  id: string
  name: string
  company: string | null
  email: string | null
}

interface BookingResult {
  meetingTime: string
  meetUrl?: string
  customerName: string
  customerCompany?: string
}

export default function BookingPage() {
  const params = useParams()
  const customerId = params.customerId as string

  const [customer, setCustomer] = useState<CustomerInfo | null>(null)
  const [, setSlots] = useState<TimeSlot[]>([])
  const [slotsByDate, setSlotsByDate] = useState<Record<string, TimeSlot[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState<BookingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch customer info
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, name, company, email')
          .eq('id', customerId)
          .single()

        if (customerError || !customerData) {
          setError('Booking link not found')
          setLoading(false)
          return
        }

        setCustomer(customerData)
        setName(customerData.name || '')
        setEmail(customerData.email || '')

        // Fetch availability
        const res = await fetch('/api/booking/availability')
        if (!res.ok) throw new Error('Failed to load availability')

        const data = await res.json()
        setSlots(data.slots || [])
        setSlotsByDate(data.slotsByDate || {})

        // Select first available date
        const dates = Object.keys(data.slotsByDate || {}).sort()
        if (dates.length > 0) {
          setSelectedDate(dates[0])
        }
      } catch (err) {
        console.error('Load error:', err)
        setError('Failed to load booking page')
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      loadData()
    }
  }, [customerId])

  const handleBook = async () => {
    if (!selectedSlot || !name.trim()) return

    setBooking(true)
    try {
      const res = await fetch('/api/booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          startTime: selectedSlot.startIso,
          endTime: selectedSlot.endIso,
          name: name.trim(),
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Booking failed')
      }

      const data = await res.json()
      setBooked(data.booking)
    } catch (err) {
      console.error('Booking error:', err)
      setError(err instanceof Error ? err.message : 'Failed to book')
    } finally {
      setBooking(false)
    }
  }

  const availableDates = Object.keys(slotsByDate).sort()

  const navigateDate = (direction: number) => {
    if (!selectedDate) return
    const currentIndex = availableDates.indexOf(selectedDate)
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < availableDates.length) {
      setSelectedDate(availableDates[newIndex])
      setSelectedSlot(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading availability...</p>
        </div>
      </div>
    )
  }

  if (error && !booked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h1 className="text-xl font-semibold mb-2">Oops!</h1>
          <p className="text-gray-500">{error}</p>
        </Card>
      </div>
    )
  }

  if (booked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">You&apos;re Booked! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Your meeting with {customer?.company || 'VXA'} is confirmed.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>{booked.meetingTime}</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span>{booked.customerName}</span>
            </div>
            {booked.customerCompany && (
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-gray-400" />
                <span>{booked.customerCompany}</span>
              </div>
            )}
            {booked.meetUrl && (
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-gray-400" />
                <a
                  href={booked.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  Join Google Meet
                </a>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500">
            A calendar invite has been sent to your email.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            V
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            Book a Meeting with {customer?.company || 'VXA'}
          </h1>
          <p className="text-gray-500">Select a time that works for you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar / Time Selection */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select a Date & Time
            </h2>

            {availableDates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No available slots</p>
                <p className="text-sm">Please contact us directly</p>
              </div>
            ) : (
              <>
                {/* Date Navigator */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateDate(-1)}
                    disabled={availableDates.indexOf(selectedDate!) === 0}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-medium">
                    {selectedDate ? formatDate(selectedDate) : 'Select a date'}
                  </span>
                  <button
                    onClick={() => navigateDate(1)}
                    disabled={
                      availableDates.indexOf(selectedDate!) ===
                      availableDates.length - 1
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Time Slots */}
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {selectedDate &&
                    slotsByDate[selectedDate]?.map((slot) => (
                      <button
                        key={slot.startIso}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedSlot?.startIso === slot.startIso
                            ? 'bg-black text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                </div>

                {/* Quick Date Selection */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Jump to date:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableDates.slice(0, 7).map((date) => (
                      <button
                        key={date}
                        onClick={() => {
                          setSelectedDate(date)
                          setSelectedSlot(null)
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          selectedDate === date
                            ? 'bg-black text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Booking Form */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Details
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything you'd like to discuss..."
                  rows={3}
                />
              </div>

              {selectedSlot && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">Selected time:</p>
                  <p className="text-gray-600">
                    {formatDate(selectedSlot.date)} at {selectedSlot.time}
                  </p>
                </div>
              )}

              <Button
                onClick={handleBook}
                disabled={!selectedSlot || !name.trim() || booking}
                className="w-full"
              >
                {booking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                30-minute meeting • Google Meet link included
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

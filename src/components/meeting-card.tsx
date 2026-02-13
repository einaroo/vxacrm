'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  getMeetingContext,
  getMeetingContextSummary,
  formatStatus,
  getStatusColor,
  EnrichedAttendee,
} from '@/lib/meeting-context'
import { Customer, Recruit } from '@/lib/types'
import {
  Clock,
  Users,
  Briefcase,
  UserPlus,
  FileText,
  DollarSign,
  Mail,
  Building,
} from 'lucide-react'

export interface Meeting {
  id: string
  title: string
  startTime: Date
  endTime: Date
  attendees: { email?: string; name: string }[]
}

export type MeetingStatus = 'upcoming' | 'in-progress' | 'past'

interface MeetingCardProps {
  meeting: Meeting
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getMeetingStatus(meeting: Meeting): MeetingStatus {
  const now = new Date()
  if (now < meeting.startTime) return 'upcoming'
  if (now >= meeting.startTime && now <= meeting.endTime) return 'in-progress'
  return 'past'
}

function getStatusStyles(status: MeetingStatus): {
  border: string
  bg: string
  indicator: string
  label: string
} {
  switch (status) {
    case 'in-progress':
      return {
        border: 'border-l-green-500',
        bg: 'bg-green-50',
        indicator: 'bg-green-500 animate-pulse',
        label: 'In Progress',
      }
    case 'upcoming':
      return {
        border: 'border-l-blue-500',
        bg: 'bg-blue-50',
        indicator: 'bg-blue-500',
        label: 'Upcoming',
      }
    case 'past':
      return {
        border: 'border-l-gray-300',
        bg: 'bg-gray-50',
        indicator: 'bg-gray-400',
        label: 'Past',
      }
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function AttendeeAvatar({
  attendee,
  showBadge = true,
}: {
  attendee: EnrichedAttendee
  showBadge?: boolean
}) {
  const bgColor =
    attendee.context.type === 'customer'
      ? 'bg-blue-100 text-blue-700'
      : attendee.context.type === 'recruit'
        ? 'bg-purple-100 text-purple-700'
        : 'bg-gray-100 text-gray-600'

  return (
    <div className="relative group">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
          bgColor
        )}
        title={attendee.name}
      >
        {getInitials(attendee.name)}
      </div>
      {showBadge && attendee.context.type !== 'unknown' && (
        <div
          className={cn(
            'absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center',
            attendee.context.type === 'customer'
              ? 'bg-blue-500'
              : 'bg-purple-500'
          )}
        >
          {attendee.context.type === 'customer' ? (
            <Briefcase className="w-2.5 h-2.5 text-white" />
          ) : (
            <UserPlus className="w-2.5 h-2.5 text-white" />
          )}
        </div>
      )}
    </div>
  )
}

function PrepDialog({
  open,
  onOpenChange,
  meeting,
  enrichedAttendees,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  meeting: Meeting
  enrichedAttendees: EnrichedAttendee[]
}) {
  const summary = getMeetingContextSummary(enrichedAttendees)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Meeting Prep: {meeting.title}
          </DialogTitle>
          <DialogDescription>
            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Attendees Overview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Attendees ({enrichedAttendees.length})
            </h3>
            <div className="space-y-2">
              {enrichedAttendees.map((attendee, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                >
                  <AttendeeAvatar attendee={attendee} showBadge={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attendee.name}
                    </p>
                    {attendee.email && (
                      <p className="text-xs text-gray-500 truncate">
                        {attendee.email}
                      </p>
                    )}
                  </div>
                  {attendee.context.type !== 'unknown' && (
                    <Badge
                      className={cn(
                        'text-xs',
                        attendee.context.type === 'customer'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                      )}
                    >
                      {attendee.context.type === 'customer'
                        ? 'Customer'
                        : 'Recruit'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Customer Details */}
          {summary.customers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Customer Context
              </h3>
              <div className="space-y-3">
                {summary.customers.map((attendee, idx) => {
                  const customer = attendee.context.data as Customer
                  return (
                    <Card key={idx} className="p-4 border-l-4 border-l-blue-500">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{customer.name}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {customer.company}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              getStatusColor('customer', customer.status)
                            )}
                          >
                            {formatStatus(customer.status)}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3.5 h-3.5" />
                            {customer.email}
                          </div>
                          {customer.mrr_value && (
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                              <DollarSign className="w-3.5 h-3.5" />
                              {customer.mrr_value.toLocaleString()} MRR
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recruit Details */}
          {summary.recruits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                Recruitment Context
              </h3>
              <div className="space-y-3">
                {summary.recruits.map((attendee, idx) => {
                  const recruit = attendee.context.data as Recruit
                  return (
                    <Card
                      key={idx}
                      className="p-4 border-l-4 border-l-purple-500"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{recruit.name}</p>
                            {recruit.position && (
                              <p className="text-sm text-gray-500">
                                {recruit.position}
                              </p>
                            )}
                          </div>
                          <Badge
                            className={cn(
                              getStatusColor('recruit', recruit.stage)
                            )}
                          >
                            {formatStatus(recruit.stage)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {recruit.email && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Mail className="w-3.5 h-3.5" />
                              {recruit.email}
                            </div>
                          )}
                          {recruit.role && (
                            <Badge variant="outline" className="text-xs">
                              {recruit.role}
                            </Badge>
                          )}
                          {recruit.technical_role && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                            >
                              Technical
                            </Badge>
                          )}
                        </div>

                        {recruit.comments && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {recruit.comments}
                          </p>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* No CRM context found */}
          {summary.customers.length === 0 && summary.recruits.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No CRM context found for attendees</p>
              <p className="text-sm">
                Attendees are not matched to any customers or recruits
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MeetingCard({ meeting, className }: MeetingCardProps) {
  const [enrichedAttendees, setEnrichedAttendees] = useState<EnrichedAttendee[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [prepOpen, setPrepOpen] = useState(false)

  const status = getMeetingStatus(meeting)
  const styles = getStatusStyles(status)

  useEffect(() => {
    async function enrichAttendees() {
      try {
        const enriched = await getMeetingContext(meeting.attendees)
        setEnrichedAttendees(enriched)
      } catch (error) {
        console.error('Error enriching attendees:', error)
        // Fall back to unknown context for all attendees
        setEnrichedAttendees(
          meeting.attendees.map((a) => ({
            ...a,
            context: { type: 'unknown' as const, data: null, matchedOn: null },
          }))
        )
      } finally {
        setLoading(false)
      }
    }

    enrichAttendees()
  }, [meeting.attendees])

  const summary = getMeetingContextSummary(enrichedAttendees)

  return (
    <>
      <Card
        className={cn(
          'p-4 border-l-4 transition-all hover:shadow-md',
          styles.border,
          className
        )}
      >
        <div className="space-y-3">
          {/* Header: Title and Status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {meeting.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className={cn('w-2 h-2 rounded-full', styles.indicator)} />
              <span className="text-xs text-gray-500">{styles.label}</span>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
            </span>
          </div>

          {/* Attendees */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="flex -space-x-2">
                  {[...Array(Math.min(3, meeting.attendees.length))].map(
                    (_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gray-200 animate-pulse border-2 border-white"
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="flex -space-x-2">
                  {enrichedAttendees.slice(0, 4).map((attendee, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-white rounded-full"
                    >
                      <AttendeeAvatar attendee={attendee} />
                    </div>
                  ))}
                  {enrichedAttendees.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white">
                      +{enrichedAttendees.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* CRM Context Badges */}
              {!loading && (summary.hasCustomer || summary.hasRecruit) && (
                <div className="flex gap-1">
                  {summary.hasCustomer && (
                    <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100">
                      <Briefcase className="w-3 h-3 mr-1" />
                      Customer
                    </Badge>
                  )}
                  {summary.hasRecruit && (
                    <Badge className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-100">
                      <UserPlus className="w-3 h-3 mr-1" />
                      Recruit
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Prep Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrepOpen(true)}
              className="flex-shrink-0"
            >
              <FileText className="w-4 h-4 mr-1" />
              Prep
            </Button>
          </div>
        </div>
      </Card>

      <PrepDialog
        open={prepOpen}
        onOpenChange={setPrepOpen}
        meeting={meeting}
        enrichedAttendees={enrichedAttendees}
      />
    </>
  )
}

export default MeetingCard

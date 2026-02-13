import { NextResponse } from 'next/server'

// Mock meetings data - replace with actual calendar integration
const mockMeetings = [
  {
    id: '1',
    title: 'Product sync with engineering',
    time: '10:00 AM',
    attendees: ['Alex', 'Jordan', 'Sam'],
  },
  {
    id: '2',
    title: 'Customer demo - Acme Corp',
    time: '2:00 PM',
    attendees: ['Chris', 'Taylor'],
  },
  {
    id: '3',
    title: 'Weekly team standup',
    time: '4:30 PM',
    attendees: ['Team'],
  },
]

export async function GET() {
  // TODO: Integrate with actual calendar API (Google Calendar, Outlook, etc.)
  // For now, return mock data
  
  return NextResponse.json({
    meetings: mockMeetings,
    date: new Date().toISOString().split('T')[0],
  })
}

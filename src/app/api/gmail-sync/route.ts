import { createClient } from '@supabase/supabase-js'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Common personal email domains to filter out
const PERSONAL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'mail.com',
  'gmx.com',
  'fastmail.com',
])

// Domains to skip entirely (automated/system emails)
const SKIP_DOMAINS = new Set([
  'vercel.com',
  'accounts.google.com',
  'google.com',
  'github.com',
  'noreply.github.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'slack.com',
  'notion.so',
  'stripe.com',
  'intercom.io',
])

interface GmailThread {
  id: string
  date: string
  from: string
  subject: string
  labels: string[]
  messageCount: number
}

interface GmailSearchResult {
  threads: GmailThread[]
  nextPageToken?: string
}

interface ParsedContact {
  name: string
  email: string
  company: string
}

function parseFromField(from: string): ParsedContact | null {
  // Patterns:
  // "Name" <email@domain.com>
  // Name <email@domain.com>
  // email@domain.com

  const emailMatch = from.match(/<([^>]+)>/)
  let email: string
  let name: string

  if (emailMatch) {
    email = emailMatch[1].toLowerCase().trim()
    // Get name from before the <
    name = from.replace(/<[^>]+>/, '').replace(/["']/g, '').trim()
  } else {
    // Just an email address
    email = from.toLowerCase().trim()
    name = email.split('@')[0].replace(/[._-]/g, ' ')
  }

  // Validate email format
  if (!email.includes('@') || !email.includes('.')) {
    return null
  }

  const domain = email.split('@')[1]

  // Skip system/automated emails
  if (SKIP_DOMAINS.has(domain)) {
    return null
  }

  // Skip no-reply addresses
  if (email.includes('noreply') || email.includes('no-reply') || email.includes('notifications@')) {
    return null
  }

  // Determine company
  let company: string
  if (PERSONAL_DOMAINS.has(domain)) {
    company = 'Personal'
  } else {
    // Use domain as company name, capitalize first letter
    company = domain.split('.')[0]
    company = company.charAt(0).toUpperCase() + company.slice(1)
  }

  // Clean up name - capitalize properly
  if (name && name !== email.split('@')[0]) {
    name = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  } else {
    // Derive name from email
    name = email
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  return { name, email, company }
}

export async function POST() {
  try {
    // Run gog command to fetch recent emails
    const { stdout, stderr } = await execAsync(
      "gog gmail search 'newer_than:30d -from:me' --max 100 --json",
      { timeout: 30000 }
    )

    if (stderr && !stdout) {
      console.error('gog stderr:', stderr)
      return Response.json({ error: 'Failed to fetch Gmail data' }, { status: 500 })
    }

    let searchResult: GmailSearchResult
    try {
      searchResult = JSON.parse(stdout)
    } catch {
      console.error('Failed to parse gog output:', stdout)
      return Response.json({ error: 'Failed to parse Gmail data' }, { status: 500 })
    }

    if (!searchResult.threads || searchResult.threads.length === 0) {
      return Response.json({ added: 0, message: 'No emails found in the last 30 days' })
    }

    // Extract unique contacts from threads
    const contactsMap = new Map<string, ParsedContact>()

    for (const thread of searchResult.threads) {
      const contact = parseFromField(thread.from)
      if (contact && !contactsMap.has(contact.email)) {
        contactsMap.set(contact.email, contact)
      }
    }

    const uniqueContacts = Array.from(contactsMap.values())

    if (uniqueContacts.length === 0) {
      return Response.json({ added: 0, message: 'No valid contacts found in emails' })
    }

    // Get existing emails from the database
    const { data: existingCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('email')
      .in('email', uniqueContacts.map(c => c.email))

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError)
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    const existingEmails = new Set(existingCustomers?.map(c => c.email) || [])

    // Filter out duplicates
    const newContacts = uniqueContacts.filter(c => !existingEmails.has(c.email))

    if (newContacts.length === 0) {
      return Response.json({ 
        added: 0, 
        message: `Found ${uniqueContacts.length} contacts, but all are already in your CRM` 
      })
    }

    // Insert new contacts as leads
    const { error: insertError } = await supabase.from('customers').insert(
      newContacts.map(contact => ({
        name: contact.name,
        email: contact.email,
        company: contact.company,
        status: 'lead',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    )

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return Response.json({ error: 'Failed to save contacts' }, { status: 500 })
    }

    return Response.json({
      added: newContacts.length,
      skipped: existingEmails.size,
      message: `Added ${newContacts.length} new contacts from Gmail`,
    })
  } catch (error) {
    console.error('Gmail sync error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to sync Gmail' },
      { status: 500 }
    )
  }
}

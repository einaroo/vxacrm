export interface Customer {
  id: string
  name: string
  email: string
  company: string
  mrr_value: number | null
  status: 'lead' | 'in-contact' | 'negotiating' | 'won' | 'lost'
  source?: string | null
  linkedin_url?: string | null
  job_title?: string | null
  created_at: string
  updated_at: string
  user_id: string | null
}

export interface Competitor {
  id: string
  name: string
  website: string | null
  company: string | null
  market_share: number | null
  status: 'watch' | 'traction' | 'bigplayer'
  pricing: string | null
  core_feature: string | null
  comment: string | null
  created_at: string
  updated_at: string
  user_id: string | null
}

export interface Recruit {
  id: string
  name: string
  email: string | null
  position: string | null
  role: string | null
  stage: 'lead' | 'screen' | 'interview' | 'offer' | 'hired'
  priority: string | null
  technical_role: boolean | null
  comments: string | null
  created_at: string
  updated_at: string
  user_id: string | null
}

export interface Expert {
  id: string
  customer_id: string | null
  customer_name: string | null  // Expert name
  company: string | null
  expertise_area: string | null
  contact_email: string | null
  status: 'identified' | 'contacted' | 'engaged' | 'active' | 'inactive' | null
  date: string | null  // Last contact date
  notes: string | null  // Insights/notes
  created_at: string
  updated_at: string
}

// Alias for backward compatibility with database table name
export type Interview = Expert

export interface ExpertInsight {
  id: string
  interview_id: string  // References expert id (table still named interview_questions)
  question: string
  answer: string | null
  created_at: string
}

// Alias for backward compatibility
export type InterviewQuestion = ExpertInsight

export type ColumnConfig<T> = {
  id: string
  title: string
  color: string
  items: T[]
}

// Signals
export type SignalCategory = 
  | 'competitor-promo'
  | 'competitor-partnership'
  | 'competitor-product'
  | 'audience-talking'
  | 'performance-decay'
  | 'performance-winner'
  | 'trend-match'

export interface Signal {
  id: string
  name: string
  category: SignalCategory
  description: string | null
  is_active: boolean
  // What to monitor
  target_type: 'competitor' | 'audience' | 'own-content' | 'trend'
  target_id: string | null  // e.g., competitor_id if tracking a competitor
  target_name: string | null
  // Monitoring config
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  last_checked_at: string | null
  // Results
  last_triggered_at: string | null
  trigger_count: number
  created_at: string
  updated_at: string
  user_id: string | null
}

export interface SignalEvent {
  id: string
  signal_id: string
  signal_name: string
  category: SignalCategory
  title: string
  description: string | null
  source_url: string | null
  severity: 'low' | 'medium' | 'high'
  is_read: boolean
  is_actioned: boolean
  // Optional: linked content suggestion
  suggested_action: string | null
  created_at: string
}

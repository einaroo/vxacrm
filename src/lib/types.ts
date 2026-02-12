export interface Customer {
  id: string
  name: string
  email: string
  company: string
  mrr_value: number | null
  status: 'lead' | 'in-contact' | 'negotiating' | 'won' | 'lost'
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

export interface Interview {
  id: string
  customer_id: string | null
  customer_name: string | null
  date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InterviewQuestion {
  id: string
  interview_id: string
  question: string
  answer: string | null
  created_at: string
}

export type ColumnConfig<T> = {
  id: string
  title: string
  color: string
  items: T[]
}

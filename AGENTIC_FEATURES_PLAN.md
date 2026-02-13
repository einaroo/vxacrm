# VXA CRM Agentic Features Plan

*Created by Lucky | 2026-02-13*
*For review by Einar & Bror*

---

## 🎯 Goals
1. **Find the best talent** — Surface top candidates, automate outreach
2. **Find the best customers** — Prioritize high-potential leads, automate follow-ups
3. **Track competitors** — Know when/why you win or lose, stay ahead
4. **Be agile** — Reduce manual work, let AI handle the repetitive stuff

---

## 📊 How Elite GTM Teams Operate

Based on best practices from high-velocity B2B sales teams:

1. **Morning briefings** — Know exactly what needs attention today
2. **Lead scoring** — Don't waste time on low-probability deals
3. **Automated sequences** — Follow-up happens automatically
4. **Meeting prep** — Walk into every call prepared
5. **Win/loss analysis** — Learn from every deal outcome
6. **Competitive triggers** — Know when competitors make moves
7. **Pipeline hygiene** — Stale deals get flagged automatically

---

## 🤖 Proposed Agentic Features

### Phase 1: Daily Operations (High Impact, Quick Wins)

#### 1. **Morning Briefing Agent**
*"Start every day knowing exactly what needs your attention"*

- **What it does:**
  - Runs at 8:00 AM daily
  - Scans pipeline for: stale deals, upcoming meetings, hot leads
  - Checks recruitment pipeline for candidates needing action
  - Summarizes competitor activity
  - Sends briefing to Slack

- **Implementation:**
  - Cron job → calls `/api/briefing` → posts to Slack
  - ~2-3 hours to build

#### 2. **Smart Follow-up Reminders**
*"Never let a deal go cold"*

- **What it does:**
  - Monitors all deals for inactivity (configurable: 3/7/14 days)
  - Drafts personalized follow-up messages
  - Nudges you via Slack with one-click actions

- **Implementation:**
  - Background job checks `updated_at` timestamps
  - OpenAI drafts context-aware follow-ups
  - ~3-4 hours to build

#### 3. **Meeting Prep Automation**
*"Walk into every call prepared"*

- **What it does:**
  - 30 min before any meeting with a CRM contact
  - Pulls all context: deal history, last contact, notes
  - Researches their latest news/LinkedIn activity
  - Sends prep doc to Slack

- **Implementation:**
  - Calendar integration already exists
  - Add pre-meeting trigger
  - ~2-3 hours to build

#### 4. **One-Click Lead Enrichment**
*"Full context on any lead instantly"*

- **What it does:**
  - For any new lead: company size, funding, tech stack, decision makers
  - Auto-populates CRM fields
  - Suggests personalized opener

- **Implementation:**
  - Extend existing `/api/companies/enrich`
  - Add more data points (Clearbit-style)
  - ~2-3 hours to build

---

### Phase 2: Intelligence & Scoring (Strategic Advantage)

#### 5. **AI Lead Scoring**
*"Focus on deals most likely to close"*

- **What it does:**
  - Scores every lead 1-100 based on:
    - Company fit (size, industry, tech stack)
    - Engagement signals (response time, meeting attendance)
    - Historical win patterns
  - Auto-prioritizes pipeline view

- **Implementation:**
  - New `lead_score` field on customers
  - Scoring algorithm based on your win history
  - ~4-5 hours to build

#### 6. **Candidate Fit Scoring**
*"Find the candidates most likely to succeed"*

- **What it does:**
  - Scores recruits based on:
    - Role fit (skills match)
    - Culture signals (background, interests)
    - Availability indicators
  - Highlights top candidates

- **Implementation:**
  - New `fit_score` field on recruits
  - AI analyzes against ideal candidate profile
  - ~3-4 hours to build

#### 7. **Competitor Movement Alerts**
*"Know when competitors make moves"*

- **What it does:**
  - Weekly scan of competitor websites, LinkedIn, news
  - Detects: new features, pricing changes, funding, hires
  - Alerts you with analysis of impact

- **Implementation:**
  - Scheduled web search per competitor
  - Change detection + summarization
  - ~4-5 hours to build

#### 8. **Win/Loss Analysis Agent**
*"Learn from every deal outcome"*

- **What it does:**
  - When deal marked won/lost, prompts for reason
  - Aggregates patterns: "Lost 3 deals to Competitor X on pricing"
  - Suggests strategy adjustments

- **Implementation:**
  - New `outcome_reason` field
  - Monthly analysis report
  - ~3-4 hours to build

---

### Phase 3: Automation & Sequences (Scale)

#### 9. **Outreach Sequence Builder**
*"Automated multi-touch campaigns"*

- **What it does:**
  - Define sequences: Day 1 email → Day 3 LinkedIn → Day 7 follow-up
  - AI personalizes each touch
  - Tracks opens/responses, adjusts timing

- **Implementation:**
  - New `sequences` table
  - Background job processes queue
  - ~6-8 hours to build

#### 10. **Auto-Sourcing Agent**
*"Continuously find new prospects/candidates"*

- **What it does:**
  - Runs weekly searches based on your ICP
  - Finds companies/candidates matching criteria
  - Adds to pipeline with enrichment

- **Implementation:**
  - Scheduled job with search criteria
  - Deduplication logic
  - ~4-5 hours to build

#### 11. **Pipeline Health Dashboard**
*"Visual health check at a glance"*

- **What it does:**
  - Real-time metrics: velocity, conversion rates, stuck deals
  - Trend analysis: improving or declining?
  - Alerts when metrics go off track

- **Implementation:**
  - New dashboard page
  - Aggregation queries
  - ~4-5 hours to build

#### 12. **Smart Notifications Hub**
*"Right info at the right time"*

- **What it does:**
  - Consolidates all alerts into one intelligent feed
  - Learns what you care about (clicks, dismisses)
  - Reduces noise, surfaces signal

- **Implementation:**
  - Notification center component
  - Preference learning
  - ~3-4 hours to build

---

## 🗓️ Recommended Build Order

| Priority | Feature | Impact | Effort | 
|----------|---------|--------|--------|
| 1 | Morning Briefing Agent | 🔥🔥🔥 | 2-3h |
| 2 | Smart Follow-up Reminders | 🔥🔥🔥 | 3-4h |
| 3 | Meeting Prep Automation | 🔥🔥🔥 | 2-3h |
| 4 | One-Click Lead Enrichment | 🔥🔥 | 2-3h |
| 5 | AI Lead Scoring | 🔥🔥🔥 | 4-5h |
| 6 | Competitor Movement Alerts | 🔥🔥 | 4-5h |
| 7 | Win/Loss Analysis | 🔥🔥 | 3-4h |
| 8 | Candidate Fit Scoring | 🔥🔥 | 3-4h |
| 9 | Pipeline Health Dashboard | 🔥🔥 | 4-5h |
| 10 | Outreach Sequence Builder | 🔥🔥🔥 | 6-8h |
| 11 | Auto-Sourcing Agent | 🔥🔥 | 4-5h |
| 12 | Smart Notifications Hub | 🔥 | 3-4h |

**Total estimated: ~45-55 hours**

---

### Phase 0: Frictionless Outreach (PRIORITY)

#### 0A. **One-Click Email from CRM**
*"Send without leaving the CRM"*

- **What it does:**
  - Click "Email" on any lead → pre-filled draft opens
  - AI personalizes based on context
  - Sends via your Gmail (gog CLI)
  - Logs to CRM automatically

- **Implementation:**
  - Email compose modal
  - Gmail integration via gog
  - ~3-4 hours

#### 0B. **Smart Booking Links**
*"Auto-schedule meetings in your calendar"*

- **What it does:**
  - Generate booking link per lead
  - Shows YOUR available slots (from Google Calendar)
  - When they book → creates event + updates CRM
  - No Calendly needed

- **Implementation:**
  - `/api/booking/[slug]` — public booking page
  - Checks your calendar availability
  - Creates event on confirmation
  - ~4-5 hours

#### 0C. **Email Sequence Triggers**
*"Automated outbound sequences"*

- **What it does:**
  - Define triggers: "New lead added" → Start sequence
  - Day 0: Intro email with booking link
  - Day 3: Follow-up if no reply
  - Day 7: Break-up email
  - Auto-stops when they reply or book

- **Implementation:**
  - `sequences` table with steps
  - Background job checks triggers
  - Gmail send + tracking
  - ~5-6 hours

---

## 🚀 Full 8-Hour Build Plan

**Hour 1-2: Frictionless Outreach Foundation**
- ✅ One-Click Email from CRM
- ✅ Smart Booking Links (availability from your calendar)

**Hour 3-4: Daily Operations**
- ✅ Morning Briefing Agent (cron → Slack)
- ✅ Smart Follow-up Reminders

**Hour 5-6: Meeting & Enrichment**
- ✅ Meeting Prep Automation (30min before trigger)
- ✅ Enhanced Lead Enrichment

**Hour 7-8: Intelligence Foundations**
- ✅ AI Lead Scoring (basic scoring model)
- ✅ Competitor Movement Alerts (weekly scan setup)
- 🔄 Email Sequence Triggers (foundation)

**Queued for next session:**
- Candidate Fit Scoring
- Win/Loss Analysis
- Pipeline Health Dashboard
- Auto-Sourcing Agent
- Smart Notifications Hub
- Full Outreach Sequences

---

## ❓ Questions Before I Start

1. **Slack channel for alerts?** Your DM, or a #vxa-crm channel?
2. **Follow-up cadence?** Default to 7 days silent = nudge?
3. **Lead scoring criteria?** What makes a "good" customer for VXA?
4. **Competitor list?** Which 5-10 to monitor actively?

---

## 📝 Your Call

Reply with:
- **"Go"** — I'll start building Phase 1 + foundations for Phase 2
- **"Adjust X"** — Tell me what to change
- **"Questions first"** — I'll wait for answers before starting

*— Lucky 🍀*

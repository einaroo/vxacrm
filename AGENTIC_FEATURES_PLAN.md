# VXA CRM Agentic Features Plan

*Created by Lucky | 2026-02-13*
*For review by Einar & Bror*

---

## ✅ COMPLETED FEATURES (8-hour build)

### ✅ 1. One-Click Email from CRM
**Status: DONE** ✓

- Email button on customer cards → opens modal
- `/api/email/draft` - AI generates personalized email based on customer context
- `/api/email/send` - sends via `gog gmail send` CLI
- Auto-logs activity by updating customer's `updated_at`
- Works for all customer statuses with contextual messaging

### ✅ 2. Smart Booking Links
**Status: DONE** ✓

- `/api/booking/availability` - checks Google Calendar for free 30-min slots
- `/api/booking/book` - creates calendar event with Google Meet link
- `/booking/[customerId]` - public booking page
- Copy booking link button on customer cards
- Auto-updates status from 'lead' → 'in-contact' when booked
- Working hours: 9-17 CET, weekends excluded

### ✅ 3. Morning Briefing Agent
**Status: DONE** ✓

- `/api/briefing` endpoint generates daily digest:
  - Deals gone silent (no update in 7+ days)
  - Today's meetings with CRM context
  - Hot leads (recently added in last 14 days)
  - Recruitment candidates needing action
- Formatted Slack message ready for posting
- Cron job: `curl https://vxa-crm.vercel.app/api/briefing` at 8:00 AM Stockholm

### ✅ 4. Smart Follow-up Reminders
**Status: DONE** ✓

- `/api/reminders/check` scans for:
  - Customers in active stages with no update in 7+ days
  - Generates AI-powered personalized follow-up drafts
- Prioritizes by MRR value
- Formatted Slack nudges with suggested messages
- Cron job: twice daily (9 AM, 2 PM)

### ✅ 5. Meeting Prep Automation
**Status: DONE** ✓

- `/api/meeting-prep` auto-generates prep docs
- Triggers 30-60 minutes before meetings
- Pulls customer/recruit context from CRM
- AI-generated talking points
- Matches attendees with CRM records
- Formatted Slack message with all context

### ✅ 6. Enhanced Lead Enrichment
**Status: DONE** ✓

- Extended `/api/companies/enrich` with:
  - Company size estimate
  - Funding stage (Seed, Series A, etc.)
  - Tech stack detection
  - Industry classification
  - Recent company news
  - AI fit scoring (0-100) for VXA
- Updates customer records with enriched data

### ✅ 7. AI Lead Scoring
**Status: DONE** ✓

- `/api/leads/score` endpoint calculates scores (0-100)
- Scoring based on 4 factors (25 points each):
  - Company fit (B2B SaaS, marketing focus = higher)
  - Deal size potential (MRR value)
  - Engagement level (status in pipeline)
  - Timing (days since last activity)
- Generates actionable recommendations per lead
- Formatted Slack leaderboard

### ✅ 8. Competitor Movement Alerts
**Status: DONE** ✓

- `/api/competitors/scan` for competitive intelligence
- AI-powered scanning for:
  - Funding announcements
  - New feature launches
  - Pricing changes
  - Key hires/departures
  - Partnerships/acquisitions
- Categorized alerts with impact levels (high/medium/low)
- Weekly digest for Slack

---

## 🔧 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/email/draft` | POST | Generate AI email draft |
| `/api/email/send` | POST | Send email via Gmail |
| `/api/booking/availability` | GET | Get free calendar slots |
| `/api/booking/book` | POST | Book a meeting |
| `/api/briefing` | GET | Generate morning briefing |
| `/api/reminders/check` | GET | Check follow-up reminders |
| `/api/meeting-prep` | GET | Generate meeting prep |
| `/api/companies/enrich` | POST | Enrich company data |
| `/api/leads/score` | GET | Score all leads |
| `/api/competitors/scan` | GET | Scan competitor news |

---

## 📅 Suggested Cron Schedule

| Time (Stockholm) | Endpoint | Frequency |
|------------------|----------|-----------|
| 8:00 AM | `/api/briefing` | Daily (weekdays) |
| 9:00 AM | `/api/reminders/check` | Daily |
| 2:00 PM | `/api/reminders/check` | Daily |
| 30 min before meetings | `/api/meeting-prep` | As needed |
| Monday 9:00 AM | `/api/leads/score` | Weekly |
| Monday 9:00 AM | `/api/competitors/scan` | Weekly |

---

## 🚀 Deployed

**Production URL:** https://vxa-crm.vercel.app

---

## 📝 Future Enhancements (Queued)

- Candidate Fit Scoring for recruits
- Win/Loss Analysis Agent
- Pipeline Health Dashboard
- Email Sequence Builder (multi-touch campaigns)
- Auto-Sourcing Agent
- Smart Notifications Hub

---

*— Lucky 🍀*

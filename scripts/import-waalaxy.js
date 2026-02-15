#!/usr/bin/env node

/**
 * Import Waalaxy prospects into VXA CRM customers table.
 * 
 * Prerequisites:
 *   1. Run the migration SQL first (add source, linkedin_url, job_title columns):
 *      supabase/migrations/20260215160000_add_source_and_linkedin_columns.sql
 *   
 *   2. Then run this script:
 *      node scripts/import-waalaxy.js
 * 
 * Uses Supabase REST API with anon key (no service role needed for inserts).
 */

const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://chvukeztleupphfivjhu.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_yr6_PEtdHBH-fgQ5jp5KvQ_kF-Zn7m0'

const WAALAXY_DATA_PATH = path.resolve(__dirname, '../../missions/sales-outbound/waalaxy-data.json')

async function main() {
  // Read Waalaxy data
  const raw = fs.readFileSync(WAALAXY_DATA_PATH, 'utf-8')
  const data = JSON.parse(raw)
  const prospects = data.prospects

  console.log(`📋 Found ${prospects.length} Waalaxy prospects to import`)

  // Fetch existing customers to check for duplicates
  const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=name,company`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
  const existing = await existingRes.json()
  
  // Build a set of existing name+company combos for dedup
  const existingSet = new Set(
    existing.map(c => `${(c.name || '').toLowerCase()}|${(c.company || '').toLowerCase()}`)
  )

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const prospect of prospects) {
    const key = `${prospect.name.toLowerCase()}|${(prospect.company || '').toLowerCase()}`
    
    if (existingSet.has(key)) {
      console.log(`⏭️  Skipping duplicate: ${prospect.name} (${prospect.company})`)
      skipped++
      continue
    }

    const payload = {
      name: prospect.name,
      email: '',
      company: prospect.company || '',
      status: 'lead',
      source: 'waalaxy',
      linkedin_url: prospect.linkedinUrl || null,
      job_title: prospect.job || null,
      mrr_value: null,
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/customers`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      console.log(`✅ Imported: ${prospect.name} — ${prospect.company}`)
      imported++
      existingSet.add(key) // Prevent re-import within same run
    } else {
      const err = await res.text()
      console.error(`❌ Failed: ${prospect.name} — ${err}`)
      errors++
    }
  }

  console.log(`\n📊 Import complete:`)
  console.log(`   ✅ Imported: ${imported}`)
  console.log(`   ⏭️  Skipped (duplicate): ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
}

main().catch(console.error)

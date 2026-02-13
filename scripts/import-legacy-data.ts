#!/usr/bin/env npx tsx
/**
 * Import legacy Supabase data from PostgreSQL dump into VXA CRM
 * 
 * Usage: npx tsx scripts/import-legacy-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

// Target Supabase configuration
const SUPABASE_URL = 'https://chvukeztleupphfivjhu.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_yr6_PEtdHBH-fgQ5jp5KvQ_kF-Zn7m0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Parse PostgreSQL COPY statement data
function parseCopyData(dump: string, tableName: string, columns: string[]): Record<string, any>[] {
  // Find the COPY statement for this table
  const pattern = new RegExp(
    `COPY public\\.${tableName}\\s*\\([^)]+\\)\\s*FROM stdin;\\n([\\s\\S]*?)\\n\\\\.`,
    'm'
  )
  
  const match = dump.match(pattern)
  if (!match) {
    console.log(`No data found for table: ${tableName}`)
    return []
  }
  
  const dataBlock = match[1]
  const rows: Record<string, any>[] = []
  
  for (const line of dataBlock.split('\n')) {
    if (!line.trim() || line === '\\.') continue
    
    const values = line.split('\t')
    const row: Record<string, any> = {}
    
    columns.forEach((col, idx) => {
      let value = values[idx]
      
      // Handle NULL values
      if (value === '\\N' || value === undefined) {
        row[col] = null
      } 
      // Handle booleans
      else if (value === 't') {
        row[col] = true
      } else if (value === 'f') {
        row[col] = false
      }
      // Handle numbers (check if it's a numeric column)
      else if (['mrr_value', 'market_share', 'order', 'questions_answered'].includes(col)) {
        row[col] = value === '' ? null : Number(value)
      }
      // Everything else is a string
      else {
        row[col] = value
      }
    })
    
    rows.push(row)
  }
  
  return rows
}

async function importCompanies(dump: string) {
  console.log('\n📁 Importing companies...')
  console.log('  ⚠ Skipped - companies table does not exist in target CRM')
  
  // Parse data for reference (used by interviews mapping)
  const columns = ['id', 'name', 'domain', 'icon_type', 'created_at', 'industry', 'company_type']
  const records = parseCopyData(dump, 'companies', columns)
  
  // Return the company data for use by other imports
  return { inserted: 0, errors: [], data: records }
}

async function importCustomers(dump: string) {
  console.log('\n👥 Importing customers...')
  
  const columns = ['id', 'name', 'email', 'company', 'mrr_value', 'status', 'created_at', 'updated_at', 'user_id']
  const records = parseCopyData(dump, 'customers', columns)
  
  if (records.length === 0) return { inserted: 0, errors: [] }
  
  const { data, error } = await supabase
    .from('customers')
    .upsert(records, { onConflict: 'id' })
    .select()
  
  if (error) {
    console.error('  Error:', error.message)
    return { inserted: 0, errors: [error.message] }
  }
  
  console.log(`  ✓ Imported ${records.length} customers`)
  return { inserted: records.length, errors: [] }
}

async function importRecruits(dump: string) {
  console.log('\n🎯 Importing recruits...')
  
  const columns = ['id', 'name', 'email', 'position', 'role', 'stage', 'priority', 'technical_role', 'created_at', 'updated_at', 'user_id', 'comments']
  const records = parseCopyData(dump, 'recruits', columns)
  
  if (records.length === 0) return { inserted: 0, errors: [] }
  
  const { data, error } = await supabase
    .from('recruits')
    .upsert(records, { onConflict: 'id' })
    .select()
  
  if (error) {
    console.error('  Error:', error.message)
    return { inserted: 0, errors: [error.message] }
  }
  
  console.log(`  ✓ Imported ${records.length} recruits`)
  return { inserted: records.length, errors: [] }
}

async function importCompetitors(dump: string) {
  console.log('\n🏢 Importing competitors...')
  
  const columns = ['id', 'name', 'website', 'company', 'market_share', 'status', 'created_at', 'updated_at', 'user_id', 'pricing', 'core_feature', 'comment']
  const records = parseCopyData(dump, 'competitors', columns)
  
  if (records.length === 0) return { inserted: 0, errors: [] }
  
  const { data, error } = await supabase
    .from('competitors')
    .upsert(records, { onConflict: 'id' })
    .select()
  
  if (error) {
    console.error('  Error:', error.message)
    return { inserted: 0, errors: [error.message] }
  }
  
  console.log(`  ✓ Imported ${records.length} competitors`)
  return { inserted: records.length, errors: [] }
}

async function importInterviews(dump: string, companiesData: any[]) {
  console.log('\n📝 Importing interviews...')
  
  const columns = ['id', 'company_id', 'status', 'pain_point_title', 'pain_point_description', 'questions_answered', 'created_at', 'updated_at']
  const records = parseCopyData(dump, 'interviews', columns)
  
  if (records.length === 0) return { inserted: 0, errors: [] }
  
  // Build company lookup map
  const companyMap = new Map(companiesData.map(c => [c.id, c.name]))
  
  // Map to target CRM schema:
  // Target: id, title, company, contact_name, notes, created_at, updated_at, user_id
  // Source: id, company_id, status, pain_point_title, pain_point_description, questions_answered, created_at, updated_at
  const mappedRecords = records.map(r => ({
    id: r.id,
    title: r.pain_point_title || r.status || 'Interview',
    company: companyMap.get(r.company_id) || null,
    contact_name: null,
    notes: r.pain_point_description || null,
    created_at: r.created_at,
    updated_at: r.updated_at,
    user_id: null
  }))
  
  const { data, error } = await supabase
    .from('interviews')
    .upsert(mappedRecords, { onConflict: 'id' })
    .select()
  
  if (error) {
    console.error('  Error:', error.message)
    return { inserted: 0, errors: [error.message] }
  }
  
  console.log(`  ✓ Imported ${records.length} interviews`)
  return { inserted: records.length, errors: [] }
}

async function importInterviewQuestions(dump: string) {
  console.log('\n❓ Importing interview questions...')
  console.log('  ⚠ Skipped - interview_questions table does not exist in target CRM')
  
  // Count records for reference
  const columns = ['id', 'interview_id', 'question', 'answer', 'order', 'created_at', 'updated_at']
  const records = parseCopyData(dump, 'interview_questions', columns)
  console.log(`  (Source has ${records.length} questions that were not imported)`)
  
  return { inserted: 0, errors: [], skipped: records.length }
}

async function main() {
  console.log('='.repeat(60))
  console.log('VXA CRM Legacy Data Import')
  console.log('='.repeat(60))
  
  // Read the PostgreSQL dump file
  const dumpPath = '/tmp/supabase_export.json'
  
  if (!fs.existsSync(dumpPath)) {
    console.error(`Error: Dump file not found at ${dumpPath}`)
    process.exit(1)
  }
  
  console.log(`\nReading dump file: ${dumpPath}`)
  const dump = fs.readFileSync(dumpPath, 'utf-8')
  console.log(`File size: ${(dump.length / 1024).toFixed(1)} KB`)
  
  // Track results
  const results: Record<string, { inserted: number; errors: string[] }> = {}
  
  // Import in order (respecting foreign key relationships)
  const companiesResult = await importCompanies(dump)
  results.companies = { inserted: companiesResult.inserted, errors: companiesResult.errors }
  
  results.customers = await importCustomers(dump)
  results.recruits = await importRecruits(dump)
  results.competitors = await importCompetitors(dump)
  results.interviews = await importInterviews(dump, companiesResult.data || [])
  results.interview_questions = await importInterviewQuestions(dump)
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('IMPORT SUMMARY')
  console.log('='.repeat(60))
  
  let totalRecords = 0
  let totalErrors = 0
  
  for (const [table, result] of Object.entries(results)) {
    const status = result.errors.length === 0 ? '✓' : '⚠'
    console.log(`${status} ${table}: ${result.inserted} records`)
    totalRecords += result.inserted
    totalErrors += result.errors.length
    
    if (result.errors.length > 0) {
      result.errors.forEach(e => console.log(`   Error: ${e}`))
    }
  }
  
  console.log('-'.repeat(60))
  console.log(`Total: ${totalRecords} records imported`)
  if (totalErrors > 0) {
    console.log(`Errors: ${totalErrors}`)
  }
  console.log('='.repeat(60))
}

main().catch(console.error)

-- Migration: Add source and linkedin_url columns to customers table
-- Date: 2026-02-15
-- Purpose: Support Waalaxy import with source tracking and LinkedIn URLs
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- URL: https://supabase.com/dashboard/project/chvukeztleupphfivjhu/sql

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS job_title text;

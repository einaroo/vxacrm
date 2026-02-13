-- Migration: Create VXA CRM tables (companies, interviews, interview_questions)
-- Date: 2026-02-13
-- 
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- URL: https://supabase.com/dashboard/project/chvukeztleupphfivjhu/sql

-- ============================================
-- 1. Create companies table
-- ============================================
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    domain text NOT NULL,
    icon_type text NOT NULL,
    industry text,
    company_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Grant permissions
GRANT ALL ON TABLE public.companies TO anon;
GRANT ALL ON TABLE public.companies TO authenticated;
GRANT ALL ON TABLE public.companies TO service_role;

-- ============================================
-- 2. Recreate interviews table with proper schema
-- ============================================

-- Drop existing interviews table (it has wrong schema)
DROP TABLE IF EXISTS public.interviews CASCADE;

-- Create interviews table with correct schema
CREATE TABLE public.interviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    company_id uuid NOT NULL,
    status text NOT NULL,
    pain_point_title text NOT NULL,
    pain_point_description text,
    questions_answered integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT interviews_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    CONSTRAINT interviews_status_check CHECK ((status = ANY (ARRAY['Customer'::text, 'Churned'::text])))
);

-- Grant permissions
GRANT ALL ON TABLE public.interviews TO anon;
GRANT ALL ON TABLE public.interviews TO authenticated;
GRANT ALL ON TABLE public.interviews TO service_role;

-- ============================================
-- 3. Create interview_questions table
-- ============================================
CREATE TABLE IF NOT EXISTS public.interview_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    interview_id uuid NOT NULL,
    question text NOT NULL,
    answer text,
    "order" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT interview_questions_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE CASCADE
);

-- Grant permissions
GRANT ALL ON TABLE public.interview_questions TO anon;
GRANT ALL ON TABLE public.interview_questions TO authenticated;
GRANT ALL ON TABLE public.interview_questions TO service_role;

-- ============================================
-- 4. Create updated_at trigger function (if not exists)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- 5. Create triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS set_interviews_updated_at ON public.interviews;
CREATE TRIGGER set_interviews_updated_at
    BEFORE UPDATE ON public.interviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_interview_questions_updated_at ON public.interview_questions;
CREATE TRIGGER set_interview_questions_updated_at
    BEFORE UPDATE ON public.interview_questions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. Create indexes for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_interviews_company_id ON public.interviews(company_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_interview_id ON public.interview_questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

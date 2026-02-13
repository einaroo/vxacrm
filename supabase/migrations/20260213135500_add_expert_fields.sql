-- Migration: Add expert fields to interviews table
-- Date: 2026-02-13
-- Purpose: Rename "Interviews" concept to "Experts" for tracking thought leaders and domain experts
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- URL: https://supabase.com/dashboard/project/chvukeztleupphfivjhu/sql

-- ============================================
-- Add new expert-related columns to interviews table
-- (keeping table name for backward compatibility)
-- ============================================

-- Add company column (organization the expert is affiliated with)
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS company text;

-- Add expertise_area column (AI/ML, Product Strategy, etc.)
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS expertise_area text;

-- Add contact_email column
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS contact_email text;

-- Add expert status column (identified, contacted, engaged, active, inactive)
-- Note: Using a new column if there's an existing status with different constraints
DO $$
BEGIN
    -- Check if status column exists with a CHECK constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interviews' AND column_name = 'status'
    ) THEN
        -- Drop the old constraint if it exists
        ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_status_check;
        
        -- Update existing status values to new format
        UPDATE public.interviews 
        SET status = 'active' 
        WHERE status = 'Customer';
        
        UPDATE public.interviews 
        SET status = 'inactive' 
        WHERE status = 'Churned';
        
        UPDATE public.interviews 
        SET status = 'identified' 
        WHERE status IS NULL OR status NOT IN ('identified', 'contacted', 'engaged', 'active', 'inactive');
    ELSE
        -- Add status column if it doesn't exist
        ALTER TABLE public.interviews 
        ADD COLUMN status text DEFAULT 'identified';
    END IF;
END $$;

-- Create index on expertise_area for filtering
CREATE INDEX IF NOT EXISTS idx_interviews_expertise_area ON public.interviews(expertise_area);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);

-- ============================================
-- Comment updates to reflect new purpose
-- ============================================
COMMENT ON TABLE public.interviews IS 'Experts - Thought leaders and domain experts to collect insights from';
COMMENT ON COLUMN public.interviews.customer_name IS 'Expert name';
COMMENT ON COLUMN public.interviews.company IS 'Company or organization the expert is affiliated with';
COMMENT ON COLUMN public.interviews.expertise_area IS 'Area of expertise (AI/ML, Product Strategy, Go-to-Market, etc.)';
COMMENT ON COLUMN public.interviews.contact_email IS 'Contact email address';
COMMENT ON COLUMN public.interviews.status IS 'Expert status: identified, contacted, engaged, active, inactive';
COMMENT ON COLUMN public.interviews.date IS 'Last contact date';
COMMENT ON COLUMN public.interviews.notes IS 'Insights and notes from conversations with this expert';

COMMENT ON TABLE public.interview_questions IS 'Expert insights - Q&A and key insights captured from expert conversations';

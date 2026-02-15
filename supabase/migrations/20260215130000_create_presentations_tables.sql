-- Migration: Create Presentations tables
-- Date: 2026-02-15
-- 
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- URL: https://supabase.com/dashboard/project/chvukeztleupphfivjhu/sql

-- ============================================
-- 1. Create presentations table
-- ============================================
CREATE TABLE IF NOT EXISTS public.presentations (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    slide_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Grant permissions
GRANT ALL ON TABLE public.presentations TO anon;
GRANT ALL ON TABLE public.presentations TO authenticated;
GRANT ALL ON TABLE public.presentations TO service_role;

-- ============================================
-- 2. Create presentation_slides table
-- ============================================
CREATE TABLE IF NOT EXISTS public.presentation_slides (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    presentation_id uuid NOT NULL,
    slide_order integer NOT NULL,
    template text NOT NULL DEFAULT 'content',
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT presentation_slides_presentation_id_fkey 
        FOREIGN KEY (presentation_id) 
        REFERENCES public.presentations(id) 
        ON DELETE CASCADE
);

-- Grant permissions
GRANT ALL ON TABLE public.presentation_slides TO anon;
GRANT ALL ON TABLE public.presentation_slides TO authenticated;
GRANT ALL ON TABLE public.presentation_slides TO service_role;

-- ============================================
-- 3. Create triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS set_presentations_updated_at ON public.presentations;
CREATE TRIGGER set_presentations_updated_at
    BEFORE UPDATE ON public.presentations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_presentation_slides_updated_at ON public.presentation_slides;
CREATE TRIGGER set_presentation_slides_updated_at
    BEFORE UPDATE ON public.presentation_slides
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. Create indexes for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_presentation_slides_presentation_id 
    ON public.presentation_slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_slides_order 
    ON public.presentation_slides(presentation_id, slide_order);
CREATE INDEX IF NOT EXISTS idx_presentations_updated_at 
    ON public.presentations(updated_at DESC);

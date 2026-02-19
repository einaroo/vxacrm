import React, { useState, useEffect, useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Fancy Components
import AnimatedGradient from '@/components/fancy/background/animated-gradient-with-svg';
import Float from '@/components/fancy/blocks/float';
import SimpleMarquee from '@/components/fancy/blocks/simple-marquee';
import Typewriter from '@/components/fancy/text/typewriter';
import TextRotate from '@/components/fancy/text/text-rotate';
import LetterSwap from '@/components/fancy/text/letter-swap-forward-anim';
import VerticalCutReveal from '@/components/fancy/text/vertical-cut-reveal';
import ScrambleIn from '@/components/fancy/text/scramble-in';
import GooeyFilter from '@/components/fancy/filter/gooey-svg-filter';
import CssBox from '@/components/fancy/blocks/css-box';

interface SlideCompositionProps {
  slideCode: string;
}

export const SlideComposition: React.FC<SlideCompositionProps> = ({ slideCode }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in at start, fade out at end
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  // Create scope for slide code execution
  const scope = {
    React,
    useState,
    useEffect,
    useCallback,
    motion,
    AnimatePresence,
    AnimatedGradient,
    Float,
    SimpleMarquee,
    Typewriter,
    TextRotate,
    LetterSwap,
    VerticalCutReveal,
    ScrambleIn,
    GooeyFilter,
    CssBox,
    cn,
  };

  // Render slide code
  let SlideContent;
  try {
    // Create a function from the slide code
    const renderFunction = new Function(...Object.keys(scope), `return (${slideCode})`);
    SlideContent = renderFunction(...Object.values(scope));
  } catch (error) {
    console.error('Error rendering slide:', error);
    SlideContent = (
      <div className="w-full h-full flex items-center justify-center bg-red-900">
        <p className="text-white text-2xl">Error rendering slide</p>
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      <div className="w-full h-full">
        {SlideContent}
      </div>
    </AbsoluteFill>
  );
};

interface PresentationCompositionProps {
  slides: Array<{
    id: string;
    code: string;
    duration?: number; // in seconds
  }>;
  transitionDuration?: number; // in frames
}

export const PresentationComposition: React.FC<PresentationCompositionProps> = ({
  slides,
  transitionDuration = 15,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate which slide should be shown
  let currentSlideIndex = 0;
  let accumulatedFrames = 0;

  for (let i = 0; i < slides.length; i++) {
    const slideDuration = (slides[i].duration || 5) * fps; // default 5 seconds
    if (frame < accumulatedFrames + slideDuration) {
      currentSlideIndex = i;
      break;
    }
    accumulatedFrames += slideDuration;
  }

  const currentSlide = slides[currentSlideIndex];
  if (!currentSlide) {
    return (
      <AbsoluteFill>
        <div className="w-full h-full bg-slate-900" />
      </AbsoluteFill>
    );
  }

  return <SlideComposition slideCode={currentSlide.code} />;
};

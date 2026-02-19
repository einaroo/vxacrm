# Remotion Video Export Setup

## Overview

vxa-crm presentations can now be exported to video using Remotion!

## Features

- ✅ Export individual slides to MP4 video
- ✅ Full Fancy Components support in video
- ✅ Animated gradients, text effects, and transitions
- ✅ Automatic fade in/fade out
- ✅ Customizable duration and FPS

## File Structure

```
remotion/
├── Root.tsx              # Remotion compositions registry
└── SlideComposition.tsx  # Slide rendering logic

src/app/api/presentations/
└── render-video/
    └── route.ts          # Video rendering API

src/components/presentations/
└── ExportVideoButton.tsx # UI component for export
```

## Usage

### 1. Export Button in UI

Add the ExportVideoButton to any slide editor:

```tsx
import { ExportVideoButton } from '@/components/presentations/ExportVideoButton';

<ExportVideoButton
  slideCode={currentSlideCode}
  slideId={slide.id}
  presentationId={presentation.id}
/>
```

### 2. Programmatic Rendering

Call the API endpoint directly:

```typescript
const response = await fetch('/api/presentations/render-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slideCode: '<motion.div>...</motion.div>',
    slideId: 'slide-123',
    presentationId: 'pres-456',
  }),
});

const { videoUrl } = await response.json();
```

### 3. Remotion Studio (Development)

Preview and debug video rendering:

```bash
npm run remotion:studio
```

This opens Remotion Studio at http://localhost:3000

## Composition Settings

### Single Slide (5 seconds)

- **Duration:** 150 frames (5 seconds at 30fps)
- **Resolution:** 1920x1080 (Full HD)
- **FPS:** 30
- **Fade:** 15 frames in/out

### Full Presentation

- **Duration:** Calculated from slides
- **Transition:** 15 frames between slides
- **Default slide duration:** 5 seconds

## Supported Components

All Fancy Components work in video:

- ✅ **Float** - Floating animations
- ✅ **SimpleMarquee** - Scrolling text
- ✅ **Typewriter** - Typing effect
- ✅ **TextRotate** - Rotating text
- ✅ **AnimatedGradient** - Animated backgrounds
- ✅ **LetterSwap** - Letter swap animation
- ✅ **VerticalCutReveal** - Cut reveal effect
- ✅ **ScrambleIn** - Scramble text effect
- ✅ **Motion** - Framer Motion animations

## Example Slide Code

### Simple Fade-In Title

```jsx
<motion.div
  className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 1 }}
>
  <h1 className="text-7xl font-bold text-white">
    Welcome
  </h1>
</motion.div>
```

### With Fancy Components

```jsx
<div className="w-full h-full relative overflow-hidden">
  <div className="absolute inset-0">
    <AnimatedGradient
      colors={["#f97316", "#ef4444", "#ec4899"]}
      speed={4}
      blur="heavy"
    />
  </div>
  <div className="relative z-10 flex items-center justify-center h-full">
    <Float speed={0.2} amplitude={[10, 8, 0]}>
      <Typewriter
        text="Amazing Presentation"
        speed={60}
        className="text-6xl font-bold text-white"
      />
    </Float>
  </div>
</div>
```

## Configuration

### Video Settings (remotion.config.ts)

```typescript
Config.setVideoImageFormat('jpeg');  // or 'png' for transparency
Config.setOverwriteOutput(true);
Config.setConcurrency(2);             // Parallel rendering threads
```

### Custom Duration

Modify composition in `remotion/Root.tsx`:

```typescript
<Composition
  id="Slide"
  component={SlideComposition}
  durationInFrames={300}  // 10 seconds at 30fps
  fps={30}
  width={1920}
  height={1080}
/>
```

### Different Resolutions

Common video sizes:

```typescript
// Full HD 16:9
width={1920}
height={1080}

// HD 16:9
width={1280}
height={720}

// Square (Instagram)
width={1080}
height={1080}

// Vertical (Stories)
width={1080}
height={1920}
```

## Storage

Videos can be:

1. **Downloaded directly** - Returned as blob for immediate download
2. **Uploaded to Supabase Storage** - Stored in `presentation-videos` bucket

To enable storage upload, create bucket:

```sql
-- In Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentation-videos', 'presentation-videos', true);
```

## Performance

### Rendering Time

Approximate render times (on typical hardware):

- 5-second slide: ~30-60 seconds
- 30-second presentation: ~3-5 minutes

### Optimization Tips

1. **Reduce blur intensity** on AnimatedGradient (use "light" instead of "heavy")
2. **Limit Float components** to 2-3 per slide
3. **Use lower FPS** for faster rendering (24fps instead of 30fps)
4. **Decrease concurrency** if memory is limited

## Troubleshooting

### "Failed to bundle"

Ensure all imports in SlideComposition.tsx are correct:

```bash
npm install @remotion/bundler @remotion/renderer remotion
```

### "Module not found"

Check that Fancy Components are installed:

```bash
npx shadcn add @fancy/float --yes
```

### Slow rendering

Increase concurrency in remotion.config.ts:

```typescript
Config.setConcurrency(4); // Use more CPU cores
```

### Memory issues

Reduce video resolution or decrease concurrency:

```typescript
Config.setConcurrency(1);
```

## CLI Commands

### Preview in Studio

```bash
npm run remotion:studio
```

### Render Single Video

```bash
npm run remotion:render Slide output.mp4 -- --props='{"slideCode":"<div>Hello</div>"}'
```

### Render Presentation

```bash
npm run remotion:render Presentation output.mp4 -- --props='{"slides":[...]}'
```

## Next Steps

1. **Add to presentation editor** - Integrate ExportVideoButton
2. **Batch export** - Export all slides in presentation at once
3. **Custom transitions** - Add slide transitions (crossfade, wipe, etc.)
4. **Audio support** - Add background music or voiceover
5. **Templates** - Pre-built video templates for common use cases

## Resources

- [Remotion Docs](https://remotion.dev)
- [Fancy Components](https://fancycomponents.dev)
- [Motion Docs](https://motion.dev)

# Fancy Components in Presentations

## Available Components

All Fancy Components are now available in slide code via the SlideRenderer.

### Animation Components

#### Float
Adds floating/hovering animation to any element.

```jsx
<Float speed={0.3} amplitude={[15, 12, 0]} rotationRange={[3, 3, 2]}>
  <h1 className="text-6xl font-bold text-white">
    Floating Title
  </h1>
</Float>
```

**Props:**
- `speed` - Animation speed (default: 0.2)
- `amplitude` - Movement range [x, y, z] in pixels
- `rotationRange` - Rotation range [x, y, z] in degrees

#### SimpleMarquee
Horizontal or vertical scrolling text/content.

```jsx
<SimpleMarquee baseVelocity={100} direction="right">
  <div className="flex items-center space-x-8 px-8">
    <h1 className="text-6xl font-bold">Your Brand</h1>
    <span className="text-4xl">•</span>
    <h1 className="text-6xl font-bold">Your Message</h1>
  </div>
</SimpleMarquee>
```

**Props:**
- `baseVelocity` - Scroll speed (pixels per second)
- `direction` - "left" | "right" | "up" | "down"
- `slowdownOnHover` - Slow down on mouse hover
- `repeat` - Number of repetitions (default: 3)

### Text Effects

#### Typewriter
Typing animation effect.

```jsx
<Typewriter
  text="Welcome to our presentation"
  speed={80}
  className="text-5xl text-white"
/>
```

**Props:**
- `text` - Text to type out
- `speed` - Typing speed in ms per character
- `className` - Additional CSS classes

#### TextRotate
Rotating text with smooth transitions.

```jsx
<TextRotate
  words={["Innovation", "Creativity", "Excellence"]}
  className="text-6xl font-bold"
/>
```

**Props:**
- `words` - Array of words to rotate
- `interval` - Time between rotations (ms)
- `className` - Additional CSS classes

#### LetterSwap
Letter-by-letter swap animation.

```jsx
<LetterSwap
  text="Amazing Presentation"
  className="text-5xl font-bold text-white"
/>
```

#### VerticalCutReveal
Vertical reveal animation with cut effect.

```jsx
<VerticalCutReveal
  text="Revealed Text"
  className="text-6xl font-bold"
/>
```

#### ScrambleIn
Scramble/decode text animation.

```jsx
<ScrambleIn
  text="Secret Message"
  className="text-5xl"
/>
```

### Background Effects

#### AnimatedGradient
Animated gradient background with SVG filters.

```jsx
<div className="w-full h-full relative">
  <div className="absolute inset-0">
    <AnimatedGradient
      colors={["#8b5cf6", "#7c3aed", "#6366f1", "#ec4899"]}
      speed={6}
      blur="medium"
    />
  </div>
  <div className="relative z-10">
    {/* Your content */}
  </div>
</div>
```

**Props:**
- `colors` - Array of hex colors for gradient
- `speed` - Animation speed (1-10)
- `blur` - Blur amount: "light" | "medium" | "heavy"

#### GooeyFilter
SVG gooey effect filter.

```jsx
<div className="w-full h-full">
  <GooeyFilter id="gooey-1" />
  <div style={{ filter: 'url(#gooey-1)' }}>
    {/* Content with gooey effect */}
  </div>
</div>
```

### Layout Components

#### CssBox
Advanced CSS-based layout boxes.

```jsx
<CssBox variant="gradient" className="p-12">
  <h1>Boxed Content</h1>
</CssBox>
```

## Complete Examples

### Example 1: Hero Slide with Marquee

```jsx
<div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900">
  <div className="h-full flex flex-col">
    <div className="flex-1 flex items-center justify-center">
      <Float speed={0.2} amplitude={[10, 8, 0]}>
        <h1 className="text-7xl font-bold text-white">
          Welcome
        </h1>
      </Float>
    </div>
    <SimpleMarquee baseVelocity={80} className="py-8">
      <div className="flex items-center space-x-12 px-12">
        <span className="text-3xl text-white/80">Innovation</span>
        <span className="text-2xl text-white/40">•</span>
        <span className="text-3xl text-white/80">Creativity</span>
        <span className="text-2xl text-white/40">•</span>
        <span className="text-3xl text-white/80">Excellence</span>
      </div>
    </SimpleMarquee>
  </div>
</div>
```

### Example 2: Animated Text Slide

```jsx
<motion.div
  className="w-full h-full flex flex-col items-center justify-center p-12 relative overflow-hidden"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <div className="absolute inset-0">
    <AnimatedGradient
      colors={["#f97316", "#ef4444", "#ec4899"]}
      speed={4}
      blur="heavy"
    />
  </div>
  <div className="relative z-10 text-center">
    <Typewriter
      text="Our Vision for 2026"
      speed={60}
      className="text-6xl font-bold text-white mb-8"
    />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2 }}
    >
      <TextRotate
        words={["Innovation", "Growth", "Impact"]}
        className="text-4xl text-white/90"
      />
    </motion.div>
  </div>
</motion.div>
```

### Example 3: Multi-Layer Effects

```jsx
<motion.div
  className="w-full h-full relative overflow-hidden bg-black"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  {/* Animated background */}
  <div className="absolute inset-0">
    <AnimatedGradient
      colors={["#3b82f6", "#8b5cf6", "#ec4899"]}
      speed={8}
      blur="medium"
    />
  </div>

  {/* Floating content */}
  <div className="relative z-10 h-full flex items-center justify-center">
    <Float speed={0.15} amplitude={[12, 10, 0]} rotationRange={[2, 2, 0]}>
      <div className="text-center">
        <LetterSwap
          text="INNOVATION"
          className="text-8xl font-black text-white mb-4"
        />
        <motion.p
          className="text-2xl text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Powered by creativity
        </motion.p>
      </div>
    </Float>
  </div>

  {/* Bottom marquee */}
  <div className="absolute bottom-0 left-0 right-0 z-20">
    <SimpleMarquee baseVelocity={60} direction="right">
      <div className="flex items-center space-x-8 px-8 py-6">
        <span className="text-xl text-white/60">Slide 1</span>
        <span className="text-lg text-white/30">•</span>
        <span className="text-xl text-white/60">Our Story</span>
      </div>
    </SimpleMarquee>
  </div>
</motion.div>
```

## Tips & Best Practices

### Performance
- Use `AnimatedGradient` sparingly (GPU intensive)
- Limit `Float` components to 2-3 per slide
- `SimpleMarquee` with `repeat={2}` is more performant than `repeat={5}`

### Accessibility
- Ensure text contrast meets WCAG standards
- Avoid rapid animations for text (can cause motion sickness)
- Provide static fallbacks for critical information

### Combining Effects
- Layer effects with z-index
- Use `relative` and `absolute` positioning
- Combine `Float` + `Typewriter` for dynamic entrances
- Use `AnimatedGradient` as background, content in foreground

### Animation Timing
- Stagger animations with `motion` delays
- Keep total animation time under 3 seconds
- Use `initial={{ opacity: 0 }}` + `animate={{ opacity: 1 }}` for smooth transitions

## Common Patterns

### Pattern: Logo Marquee
```jsx
<SimpleMarquee baseVelocity={50} repeat={3}>
  <div className="flex items-center space-x-16 px-16">
    <img src="/logo1.svg" className="h-12" />
    <img src="/logo2.svg" className="h-12" />
    <img src="/logo3.svg" className="h-12" />
  </div>
</SimpleMarquee>
```

### Pattern: Reveal Title
```jsx
<Float speed={0.2} amplitude={[8, 6, 0]}>
  <VerticalCutReveal
    text="Big Announcement"
    className="text-7xl font-bold text-white"
  />
</Float>
```

### Pattern: Dynamic Stats
```jsx
<div className="grid grid-cols-3 gap-8">
  {[
    { label: "Users", value: "1M+" },
    { label: "Revenue", value: "$50M" },
    { label: "Growth", value: "300%" }
  ].map((stat, i) => (
    <motion.div
      key={i}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: i * 0.2 }}
    >
      <Float speed={0.3} amplitude={[5, 5, 0]}>
        <div className="text-center">
          <Typewriter
            text={stat.value}
            speed={40}
            className="text-5xl font-bold text-white"
          />
          <p className="text-xl text-white/60 mt-2">{stat.label}</p>
        </div>
      </Float>
    </motion.div>
  ))}
</div>
```

## Troubleshooting

**Component not found:**
- Make sure component is imported in SlideRenderer.tsx
- Check spelling matches exactly (case-sensitive)

**Animation not smooth:**
- Reduce `amplitude` on Float
- Lower `speed` on AnimatedGradient
- Use `blur="light"` instead of "heavy"

**Text not visible:**
- Check z-index layering
- Ensure text color contrasts with background
- Add `drop-shadow-lg` or `text-shadow` for visibility

**Preview shows error:**
- Check JSX syntax (all tags must close)
- Ensure className uses double quotes
- Verify all props are valid for the component

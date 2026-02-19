/**
 * Fancy Components Reference for AI Code Generation
 * Source: https://fancycomponents.dev
 * 
 * This file contains accurate documentation for all available Fancy components
 * to be used by the AI slide code generator.
 */

export const FANCY_COMPONENTS_REFERENCE = `
# Fancy Components Reference

## Available Components

### Float
A component that creates a gentle floating effect on its child.

**Import:** import Float from "@/components/fancy/blocks/float"

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children* | React.ReactNode | - | The content to be animated |
| speed | number | 0.5 | Speed of the floating animation |
| amplitude | [number, number, number] | [10, 30, 30] | Movement range in pixels for X, Y and Z axes |
| rotationRange | [number, number, number] | [15, 15, 7.5] | Maximum rotation in degrees for X, Y and Z axes |
| timeOffset | number | 0 | Offset to stagger animations between multiple instances |
| className | string | - | Additional CSS classes |

**Example:**
\`\`\`tsx
<Float speed={0.3} amplitude={[15, 10, 5]} rotationRange={[5, 5, 2]} timeOffset={0}>
  <div className="w-24 h-24 bg-blue-500 rounded-lg" />
</Float>
\`\`\`

---

### AnimatedGradient
An animated multi-color gradient background effect with SVG elements.

**Import:** import AnimatedGradient from "@/components/fancy/background/animated-gradient-with-svg"

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| colors* | string[] | - | Array of color strings (hex/rgb) |
| speed | number | 5 | Animation speed |
| blur | "light" \\| "medium" \\| "heavy" | "light" | Blur intensity |

**Example:**
\`\`\`tsx
<div className="relative w-full h-full overflow-hidden">
  <AnimatedGradient colors={["#ff5941", "#ff9d00", "#ffcc00"]} speed={8} blur="medium" />
  <div className="relative z-10">Content here</div>
</div>
\`\`\`

---

### Typewriter
A component that types out text, one letter at a time.

**Import:** import Typewriter from "@/components/fancy/text/typewriter"

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| text* | string \\| string[] | - | Text or array of texts to type out |
| as | ElementType | "div" | HTML tag to render as |
| speed | number | 50 | Typing speed in milliseconds |
| initialDelay | number | 0 | Delay before typing starts (ms) |
| waitTime | number | 2000 | Wait time between typing and deleting (ms) |
| deleteSpeed | number | 30 | Delete speed in milliseconds |
| loop | boolean | true | Whether to loop through texts |
| className | string | - | CSS classes |
| showCursor | boolean | true | Show cursor |
| cursorChar | string \\| ReactNode | "\\|" | Cursor character |
| cursorClassName | string | "ml-1" | Cursor CSS classes |

**Example:**
\`\`\`tsx
<Typewriter 
  text={["Innovation", "Excellence", "Growth"]}
  speed={60}
  waitTime={1500}
  className="text-4xl font-bold text-blue-500"
  cursorChar="_"
/>
\`\`\`

---

### TextRotate
A text component that switches the rendered text from a list with animations.

**Import:** import TextRotate from "@/components/fancy/text/text-rotate"

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| texts* | string[] | - | Array of texts to rotate through |
| as | ElementType | "p" | HTML tag to render as |
| rotationInterval | number | 2000 | Time between rotations (ms) |
| initial | MotionProps["initial"] | { y: "100%", opacity: 0 } | Initial animation state |
| animate | MotionProps["animate"] | { y: 0, opacity: 1 } | Animate state |
| exit | MotionProps["exit"] | { y: "-120%", opacity: 0 } | Exit animation state |
| staggerDuration | number | 0 | Stagger delay between elements (seconds) |
| staggerFrom | "first" \\| "last" \\| "center" \\| number \\| "random" | "first" | Stagger direction |
| transition | Transition | { type: "spring", damping: 25, stiffness: 300 } | Animation transition |
| loop | boolean | true | Loop through texts |
| auto | boolean | true | Auto-rotate |
| splitBy | "words" \\| "characters" \\| "lines" \\| string | "characters" | How to split text |
| mainClassName | string | - | Main container classes |
| splitLevelClassName | string | - | Split wrapper classes |
| elementLevelClassName | string | - | Individual element classes |

**Example:**
\`\`\`tsx
<div className="flex items-center text-4xl">
  <span>Make it </span>
  <TextRotate
    texts={["fast", "fun", "fancy"]}
    mainClassName="px-2 bg-orange-500 text-white rounded-lg overflow-hidden"
    staggerFrom="last"
    initial={{ y: "100%" }}
    animate={{ y: 0 }}
    exit={{ y: "-120%" }}
    staggerDuration={0.025}
    transition={{ type: "spring", damping: 30, stiffness: 400 }}
    rotationInterval={2000}
  />
</div>
\`\`\`

---

### SimpleMarquee
A marquee component for scrolling HTML elements horizontally or vertically.

**Import:** import SimpleMarquee from "@/components/fancy/blocks/simple-marquee"

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children* | React.ReactNode | - | Elements to scroll |
| className | string | - | Container classes |
| direction | "left" \\| "right" \\| "up" \\| "down" | "right" | Scroll direction |
| baseVelocity | number | 5 | Base scroll velocity |
| repeat | number | 3 | Times to repeat children |
| slowdownOnHover | boolean | false | Slow on hover |
| slowDownFactor | number | 0.3 | Slow down multiplier |
| draggable | boolean | false | Allow dragging |

**Example:**
\`\`\`tsx
<SimpleMarquee baseVelocity={5} direction="left" repeat={4}>
  <span className="mx-4 text-2xl">INNOVATION</span>
  <span className="mx-4 text-2xl">•</span>
  <span className="mx-4 text-2xl">EXCELLENCE</span>
  <span className="mx-4 text-2xl">•</span>
</SimpleMarquee>
\`\`\`

---

### LetterSwapForward (LetterSwap)
A text component that swaps letters vertically on hover.

**Import:** import LetterSwapForward from "@/components/fancy/text/letter-swap-forward-anim"

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label* | string | - | Text to display |
| reverse | boolean | true | Reverse animation direction |
| staggerDuration | number | 0.03 | Stagger between letters |
| staggerFrom | "first" \\| "last" \\| "center" \\| number | "first" | Stagger direction |
| className | string | - | CSS classes |

**Example:**
\`\`\`tsx
<LetterSwapForward 
  label="HOVER ME" 
  className="text-4xl font-bold"
  staggerDuration={0.02}
/>
\`\`\`

---

### VerticalCutReveal
A text component that reveals text with a cut reveal effect.

**Import:** import VerticalCutReveal from "@/components/fancy/text/vertical-cut-reveal"

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children* | string | - | Text to reveal |
| splitBy | "characters" \\| "words" \\| "lines" \\| string | "characters" | How to split |
| staggerDuration | number | 0.025 | Stagger delay |
| staggerFrom | "first" \\| "last" \\| "center" \\| "random" \\| number | "first" | Direction |
| transition | Transition | { type: "spring", stiffness: 200, damping: 21 } | Animation |
| containerClassName | string | - | Container classes |
| wordLevelClassName | string | - | Word wrapper classes |
| elementLevelClassName | string | - | Element classes |

**Example:**
\`\`\`tsx
<VerticalCutReveal
  splitBy="words"
  staggerDuration={0.1}
  containerClassName="text-4xl font-bold"
>
  Welcome to the future
</VerticalCutReveal>
\`\`\`

---

### ScrambleIn
A text component that reveals text with a scrambled animation.

**Import:** import ScrambleIn from "@/components/fancy/text/scramble-in"

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| text* | string | - | Text to reveal |
| scrambleSpeed | number | 50 | Speed of scramble effect (ms) |
| scrambledLetterCount | number | 2 | Letters scrambling at once |
| characters | string | "abcdefghijklmnopqrstuvwxyz" | Characters for scramble |
| className | string | - | CSS classes |
| scrambledClassName | string | - | Scrambled text classes |
| autoStart | boolean | true | Start automatically |

**Example:**
\`\`\`tsx
<ScrambleIn 
  text="WELCOME TO THE FUTURE"
  scrambleSpeed={30}
  scrambledLetterCount={3}
  className="text-4xl font-mono"
/>
\`\`\`

---

## Motion (Framer Motion) Integration

All Fancy components work with Framer Motion. Use motion.div for custom animations:

\`\`\`tsx
import { motion } from "motion/react"

<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
  className="..."
>
  Content
</motion.div>
\`\`\`

## Common Patterns

### Staggered Children
\`\`\`tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
  }}
>
  {items.map((item, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
\`\`\`

### Floating Decorations
\`\`\`tsx
<Float speed={0.3} amplitude={[10, 15, 5]} timeOffset={0}>
  <div className="w-8 h-8 rounded-full bg-blue-500/30" />
</Float>
<Float speed={0.4} amplitude={[15, 10, 8]} timeOffset={1}>
  <div className="w-12 h-12 rounded-full bg-purple-500/20" />
</Float>
\`\`\`

### Gradient Background with Content
\`\`\`tsx
<div className="relative w-full h-full overflow-hidden">
  <AnimatedGradient colors={["#4f46e5", "#7c3aed", "#ec4899"]} speed={6} blur="heavy" />
  <div className="relative z-10 flex items-center justify-center h-full">
    <h1 className="text-6xl font-bold text-white">Title</h1>
  </div>
</div>
\`\`\`
`;

export default FANCY_COMPONENTS_REFERENCE;

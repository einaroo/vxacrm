# Fancy Components Reference

**Registry:** `@fancy`
**Location:** `components/fancy/blocks/`
**Documentation:** https://fancycomponents.dev

## Available to Agents

The project has access to **158+ animated UI components** from Fancy Components registry.

### Installation Command

```bash
npx shadcn add @fancy/component-name --yes
```

**Example:**
```bash
npx shadcn add @fancy/simple-marquee --yes
npx shadcn add @fancy/pixel-trail --yes
npx shadcn add @fancy/stacking-cards --yes
```

### Usage in Code

Components are installed to `components/fancy/blocks/[name].tsx`:

```tsx
import SimpleMarquee from "@/components/fancy/blocks/simple-marquee"
import PixelTrail from "@/components/fancy/blocks/pixel-trail"

export default function MyPage() {
  return (
    <SimpleMarquee baseVelocity={100}>
      <div>Scrolling content</div>
    </SimpleMarquee>
  )
}
```

## MCP Tools for Discovery

Agents have access to shadcn MCP tools to search and install components:

### 1. List Available Components
```typescript
mcp__shadcn__list_items_in_registries({
  registries: ["@fancy"],
  limit: 20,
  offset: 0
})
```

### 2. Search for Specific Component
```typescript
mcp__shadcn__search_items_in_registries({
  registries: ["@fancy"],
  query: "carousel",
  limit: 10
})
```

### 3. View Component Details
```typescript
mcp__shadcn__view_items_in_registries({
  items: ["@fancy/simple-marquee"]
})
```

### 4. Get Installation Command
```typescript
mcp__shadcn__get_add_command_for_items({
  items: ["@fancy/simple-marquee"]
})
```

### 5. Find Usage Examples
```typescript
mcp__shadcn__get_item_examples_from_registries({
  registries: ["@fancy"],
  query: "marquee-demo"
})
```

## Popular Components

### Animation & Motion
- `simple-marquee` - Horizontal/vertical scrolling text
- `pixel-trail` - Pixelated mouse trail effect
- `image-trail` - Image following mouse cursor
- `parallax-floating` - Parallax floating elements
- `float` - Floating animation
- `screensaver` - Screensaver-style animation

### Carousels & Sliders
- `simple-carousel` - Basic carousel
- `box-carousel` - 3D box carousel
- `stacking-cards` - Card stack with swipe

### Interactive
- `drag-elements` - Draggable elements
- `cursor-attractor-and-gravity` - Cursor gravity effects
- `elastic-line` - Elastic SVG line following cursor

### SVG Effects
- `animated-gradient-with-svg` - Animated SVG gradients
- `element-along-svg-path` - Elements moving on SVG path
- `marquee-along-svg-path` - Marquee following SVG path
- `gooey-svg-filter` - Gooey SVG filter effects
- `pixelate-svg-filter` - Pixelation filter

### Layout
- `media-between-text` - Media embedded in text flow
- `circling-elements` - Elements in circular motion
- `css-box` - Advanced CSS box layouts

## When to Use

**Use Fancy Components for:**
- Marketing pages with premium animations
- Hero sections with motion effects
- Interactive product showcases
- Scroll-based animations
- Mouse-following effects
- Carousels and image galleries
- Creative text effects

**Prefer shadcn (@shadcn registry) for:**
- Form controls (input, select, checkbox)
- Data display (table, card, badge)
- Navigation (tabs, menu, breadcrumb)
- Overlays (dialog, popover, tooltip)
- Standard UI patterns

## Dependencies

All Fancy Components require:
- `motion` (already installed: v12.23.26)
- `tailwindcss` (already installed: v4.1.18)

Some components may require additional dependencies - these get added to `package.json` automatically. Run `bun install` after adding components.

## Component Naming Convention

When agents search or install:
- **Registry prefix:** `@fancy/`
- **File location:** `components/fancy/blocks/`
- **Import path:** `@/components/fancy/blocks/[name]`

**Example:**
```
Registry:  @fancy/simple-marquee
File:      components/fancy/blocks/simple-marquee.tsx
Import:    @/components/fancy/blocks/simple-marquee
```

## Agent Instructions

When user requests animated or interactive UI components:

1. **Search first:** Use `mcp__shadcn__search_items_in_registries` with `@fancy` registry
2. **View details:** Use `mcp__shadcn__view_items_in_registries` to understand the component
3. **Install:** Use Bash tool with `npx shadcn add @fancy/[name] --yes`
4. **Import & use:** Create usage example with proper import path

**Example workflow:**
```
User: "Add a marquee effect for scrolling logos"

Agent:
1. Search: mcp__shadcn__search_items_in_registries({ registries: ["@fancy"], query: "marquee" })
2. Find: simple-marquee, marquee-along-svg-path
3. Install: npx shadcn add @fancy/simple-marquee --yes
4. Provide usage example
```

## Troubleshooting

**"Component not found":** Make sure to use `@fancy/` prefix
**"Dependencies not installed":** Run `bun install` after adding components
**"Import error":** Check path is `@/components/fancy/blocks/[name]`
**"Type errors":** Ensure `motion` v12.23.26+ is installed

## More Components

To see all 158 available components:
```bash
npx shadcn view @fancy
```

Or use MCP tool with offset pagination to browse all:
```typescript
mcp__shadcn__list_items_in_registries({
  registries: ["@fancy"],
  limit: 20,
  offset: 0  // Use 20, 40, 60... to paginate
})
```

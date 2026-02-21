# Tuk-Tuk — Brand Design System & AI Prompt Guide

**Version:** 2.0  
**Purpose:** Paste this entire document as context when asking any AI agent (Google AI Studio, ChatGPT, Claude, v0, Bolt, etc.) to generate UI, landing pages, React components, or any visual asset for the בקשר project. This ensures visual consistency across all outputs.

---

## 0. CREATIVE DIRECTION — READ THIS FIRST

**This is the most important section. It defines the FEELING, not just the specs.**

### The Emotional Core

בקשר is for people who just moved to a new country. They're anxious, lonely, navigating bureaucracy in a foreign language, and craving human connection. The app is their first friend — it should FEEL like walking into a warm living room, not a corporate lobby.

### Visual Mood (reference these, not SaaS templates)

Think of the visual warmth of: a cozy café menu board, a Duolingo-style playful app, a friendly board game box, a WhatsApp group chat with your best friends. The aesthetic lives somewhere between **playful mobile game** and **warm community platform**.

### The "Living Room" Test

Before finalizing any design, ask: "Does this feel like a living room or an office?" If it feels like an office, it's wrong. Specifically:

- **YES:** Organic shapes, hand-drawn-feel illustrations, warm gradients, emoji, playful icons, rounded everything, casual language, visible people/avatars, scattered colorful dots as decoration
- **NO:** Stock-photo headers, grid-heavy corporate layouts, thin gray lines everywhere, "Learn More" buttons, feature comparison tables, blue-white-gray color schemes, formal language, geometric precision

### Mandatory Design Personality Traits

1. **Warm, not cool.** Vivid Coral (#FF7F50) should be visible and prominent — on card backgrounds, section backgrounds, decorative elements. Don't let Lyons Blue (#005871) dominate the whole page. The blue is for structure (nav, buttons); the warmth comes from everything else.
2. **Playful, not polished.** Use slightly oversized border-radius (20-24px on cards, not just 12px). Overlap elements. Tilt things 1-2°. Add decorative dots and circles from the logo palette scattered as background texture.
3. **Human, not corporate.** Show avatar circles, chat bubbles, emoji, hand-wave icons. Every section should hint at real people connecting, not features being listed.
4. **Breathable, not dense.** Massive padding. Big line-height. Sections should float in space. Content should never feel packed or busy.
5. **Game-like, not app-like.** Progress bars, achievement badges, fun stats, confetti moments. The UI should reward and delight, not just inform.

### Background & Texture Rules

- **NEVER** use plain white (#FFFFFF) as the full page background. Always use `#F7F4F0` (warm off-white) or `#F0F0F0` with warm-tinted sections.
- **Alternate section backgrounds** between warm and cool: e.g., `#F7F4F0` (warm cream) → `#EDF8F9` (light teal tint) → `#F7F4F0`. This creates rhythm and prevents the "endless white page" corporate feel.
- **Decorative scattered dots:** Use small circles (6-14px) in palette colors (`#33BECC`, `#FF7F50`, `#DCD494`) at 10-20% opacity, randomly placed in hero/section backgrounds. This echoes the logo's network nodes and adds texture.
- Hero sections can use a soft radial gradient: `radial-gradient(ellipse at 70% 30%, rgba(51,190,204,0.08), transparent 60%)`.

### Anti-Patterns — NEVER Do These

| ❌ DON'T | ✅ DO INSTEAD |
|----------|--------------|
| White page with centered text blocks | Warm tinted backgrounds with scattered decorative elements |
| Tiny pills with statistics as hero content | Big, warm, human-centered hero with illustration or avatars |
| Gray divider lines between sections | Color-tinted section backgrounds that flow into each other |
| Feature grid with icons in circles | Playful cards with rounded corners, slight shadows, and tilt |
| "Learn More" / "Get Started" generic CTAs | "Найти друзей" / "Начать игру" / "הצטרפו" warm action words |
| Header with just logo + nav links | Header with logo + friendly greeting or status |
| Stock photography | Abstract warm illustrations, avatar groups, or the logo pattern as decoration |
| Long paragraphs explaining features | Short punchy text with emoji, icons, and visual examples |
| Symmetric, grid-aligned everything | Slight asymmetry, overlapping cards, organic flow |

---

## 1. BRAND OVERVIEW

**Name:** Tuk-Tuk  
**Product:** A social game app for new repatriants (olim) in Israel. It helps people make real friends through playful ice-breaker games, community challenges, and gamified social matching. It's a game first, a social platform second.  
**Voice & Tone:** Like a friendly neighbor who just moved in too. Warm, encouraging, slightly playful, never formal. Uses emoji naturally. Celebrates small wins. Says "ты" not "Вы".  
**Languages:** Hebrew (RTL), Russian, English. The app is multilingual — always account for bidirectional text.  
**Target audience:** New immigrants to Israel, ages 18-65, with varying digital literacy. Design for the least tech-savvy user first.

---

## 2. LOGO — EXACT SVG (use as-is, do not recreate or approximate)

The logo is a network/community graph with a central "B" node surrounded by colored satellite nodes connected by lines. **Always embed this exact SVG. Never try to redraw, simplify, or reinterpret it.**

### 2A. Full-Color Logo (default — use on light backgrounds)

```svg
<svg viewBox="38 40 128 115" width="128" height="115" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="v6-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#33BECC" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#33BECC" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="105" cy="95" r="80" fill="url(#v6-glow)"/>
  <circle cx="105" cy="88" r="20" fill="#005871"/>
  <circle cx="105" cy="88" r="23" fill="none" stroke="#33BECC" stroke-width="1.5" opacity="0.4"/>
  <circle cx="60" cy="58" r="11" fill="#33BECC"/>
  <circle cx="150" cy="58" r="9" fill="#FF7F50"/>
  <circle cx="55" cy="115" r="8" fill="#DCD494"/>
  <circle cx="148" cy="120" r="10" fill="#33BECC" opacity="0.7"/>
  <circle cx="105" cy="140" r="7" fill="#FF7F50" opacity="0.6"/>
  <circle cx="68" cy="82" r="5" fill="#005871" opacity="0.4"/>
  <circle cx="140" cy="85" r="5.5" fill="#DCD494" opacity="0.5"/>
  <line x1="105" y1="88" x2="60" y2="58" stroke="#33BECC" stroke-width="1.5" opacity="0.35"/>
  <line x1="105" y1="88" x2="150" y2="58" stroke="#FF7F50" stroke-width="1.5" opacity="0.35"/>
  <line x1="105" y1="88" x2="55" y2="115" stroke="#DCD494" stroke-width="1.5" opacity="0.35"/>
  <line x1="105" y1="88" x2="148" y2="120" stroke="#33BECC" stroke-width="1.2" opacity="0.3"/>
  <line x1="105" y1="88" x2="105" y2="140" stroke="#FF7F50" stroke-width="1.2" opacity="0.3"/>
  <line x1="60" y1="58" x2="55" y2="115" stroke="#005871" stroke-width="1" opacity="0.15"/>
  <line x1="150" y1="58" x2="148" y2="120" stroke="#005871" stroke-width="1" opacity="0.15"/>
  <text x="105" y="96" font-family="Rubik, sans-serif" font-weight="700" font-size="22" fill="#fff" text-anchor="middle">B</text>
</svg>
```

### 2B. Dark Background Logo (use on #005871, #1A1A1A, or any dark background)

Key differences from light version: central node is **white** (not brand blue), "B" letter is **#005871** (not white), satellite opacities are boosted for visibility, connection lines are brighter, secondary cross-links use white instead of brand blue.

```svg
<svg viewBox="38 40 128 115" width="128" height="115" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="v6-glow-dark" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#33BECC" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#33BECC" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="105" cy="95" r="80" fill="url(#v6-glow-dark)"/>
  <circle cx="105" cy="88" r="20" fill="#FFFFFF"/>
  <circle cx="105" cy="88" r="23" fill="none" stroke="#33BECC" stroke-width="1.5" opacity="0.5"/>
  <circle cx="60" cy="58" r="11" fill="#33BECC"/>
  <circle cx="150" cy="58" r="9" fill="#FF7F50"/>
  <circle cx="55" cy="115" r="8" fill="#DCD494"/>
  <circle cx="148" cy="120" r="10" fill="#33BECC" opacity="0.8"/>
  <circle cx="105" cy="140" r="7" fill="#FF7F50" opacity="0.7"/>
  <circle cx="68" cy="82" r="5" fill="#FFFFFF" opacity="0.3"/>
  <circle cx="140" cy="85" r="5.5" fill="#DCD494" opacity="0.6"/>
  <line x1="105" y1="88" x2="60" y2="58" stroke="#33BECC" stroke-width="1.5" opacity="0.45"/>
  <line x1="105" y1="88" x2="150" y2="58" stroke="#FF7F50" stroke-width="1.5" opacity="0.45"/>
  <line x1="105" y1="88" x2="55" y2="115" stroke="#DCD494" stroke-width="1.5" opacity="0.45"/>
  <line x1="105" y1="88" x2="148" y2="120" stroke="#33BECC" stroke-width="1.2" opacity="0.4"/>
  <line x1="105" y1="88" x2="105" y2="140" stroke="#FF7F50" stroke-width="1.2" opacity="0.4"/>
  <line x1="60" y1="58" x2="55" y2="115" stroke="#FFFFFF" stroke-width="1" opacity="0.1"/>
  <line x1="150" y1="58" x2="148" y2="120" stroke="#FFFFFF" stroke-width="1" opacity="0.1"/>
  <text x="105" y="96" font-family="Rubik, sans-serif" font-weight="700" font-size="22" fill="#005871" text-anchor="middle">B</text>
</svg>
```

### 2C. Logo Usage Rules

- **Light backgrounds (#F7F4F0, #FFFFFF, #EDF8F9):** Use the light logo from Section 2A.
- **Dark backgrounds (#005871, #1A1A1A, or any dark color):** Use the dark variant from Section 2B (white center node, brand-colored "B").
- **Navbar / header:** Place logo SVG inline at `width="36" height="32"` to `width="48" height="43"`, followed by the wordmark **בקשר** in Rubik Bold, color `#005871` (light bg) or `#F0F0F0` (dark bg).
- **Splash / hero:** Use larger at `width="128" height="115"` or scale proportionally.
- **Favicon:** Use only the central node (circle `#005871` with white "B") at 32×32.
- **Minimum size:** Never render below `width="28"`.
- **Clear space:** Maintain padding equal to the radius of the central node on all sides.
- **DO NOT** add drop shadows, outlines, backgrounds, or any effects to the logo.
- **DO NOT** change any colors, opacities, stroke widths, or node positions.
- **Gradient IDs:** If using multiple logos on one page, make gradient IDs unique (e.g., `v6-glow-1`, `v6-glow-2`) to avoid SVG conflicts.

### 2D. Wordmark

The brand name **בקשר** always appears in **Rubik, weight 700** next to the logo mark. On light backgrounds use `#005871`. On dark backgrounds use `#F0F0F0`.

---

## 3. COLOR PALETTE

Based on psychological research for repatriants: warm, grounded tones that balance trust with playfulness. Follow the **60-30-10 rule**: 60% dominant neutral, 30% secondary brand, 10% accent.

### Primary Colors

| Name | HEX | RGB | Role |
|------|-----|-----|------|
| **Lyons Blue** | `#005871` | 0, 88, 113 | Primary brand. Headers, nav, wordmark, primary buttons. Conveys stability and digital trust. |
| **Blue Curaçao** | `#33BECC` | 51, 190, 204 | Secondary accent. Icons, links, highlights, achievement badges. Conveys energy and freshness. |
| **Vivid Coral** | `#FF7F50` | 255, 127, 80 | Warm accent. Card backgrounds, secondary buttons, warm UI touches. Vivid, luminous, and energetic — conveys warmth and modern friendliness. |

### Supporting Colors

| Name | HEX | RGB | Role |
|------|-----|-----|------|
| **Lemon Grass** | `#DCD494` | 220, 212, 148 | Progress indicators, onboarding highlights, success states. Conveys optimism and growth. |
| **Cloud Dancer** | `#F0F0F0` | 240, 240, 240 | Secondary neutral background. |
| **Warm Cream** | `#F7F4F0` | 247, 244, 240 | **PRIMARY page background.** Warm off-white that prevents the "sterile office" feel. |
| **Teal Tint** | `#EDF8F9` | 237, 248, 249 | Alternating section background. Light, fresh, pairs with Warm Cream. |
| **Deep Dark** | `#1A1A1A` | 26, 26, 26 | Text on light backgrounds. Dark theme backgrounds. |

### Semantic Colors

| State | Color | Usage |
|-------|-------|-------|
| Success | `#4CAF50` | Confirmations, completed actions |
| Error | `#E53935` | Error messages, destructive actions |
| Warning | `#FFA726` | Caution states |
| Info | `#33BECC` (Blue Curaçao) | Informational messages |

### Color Application Rules

- **Page background:** NEVER plain `#FFFFFF`. Use `#F7F4F0` (warm cream) as default. Alternate sections with `#EDF8F9` (light teal tint) for rhythm.
- **Warm section backgrounds:** `rgba(255, 127, 80, 0.06)` — a whisper of Vivid Coral. Use generously.
- **Primary buttons / CTA:** `linear-gradient(135deg, #005871, #004559)` background with `#FFFFFF` text. Hover: darken gradient. Border-radius: 20-24px always.
- **Secondary buttons:** `linear-gradient(135deg, #FF7F50, #FF6B4A)` background with `#FFFFFF` text, OR outlined with `#FF7F50` border (warm, not cold).
- **Links and interactive accents:** `#33BECC`.
- **Card surfaces:** `#FFFFFF` with `border-radius: 16-20px`, `border: 1px solid rgba(0,88,113,0.08)` for crisp definition, and tight engineered shadow. Cards should feel touchable yet precise.
- **Text:** `#1A1A1A` on light, `#F0F0F0` on dark. Secondary text: `#6B7280`.
- **Decorative dots/circles:** Scatter small circles in `#33BECC`, `#FF7F50`, `#DCD494` at 10-20% opacity as background texture. This echoes the logo's network nodes.
- **Never** use pure black `#000000` — always use `#1A1A1A`.
- **Never** use more than one bright accent color in the same component.
- **Never** let Lyons Blue (#005871) dominate more than 20% of any page's visible area. It's for structure and anchoring, not for painting entire sections.

---

## 4. TYPOGRAPHY

### Font Stack

| Font | Weight | Script Support | Usage |
|------|--------|----------------|-------|
| **Rubik** | 400, 500, 600, 700 | Latin, Cyrillic, Hebrew | Primary font for everything: headings, body, buttons, UI |

**Rubik** was chosen because it supports all three scripts (Hebrew, Cyrillic, Latin) in a single family with rounded, friendly geometry that matches the brand's safe/playful tone. It is available on Google Fonts.

**Load from Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**CSS font stack:**
```css
font-family: 'Rubik', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| H1 (Hero) | 48px / 3rem | 700 | 1.2 | -0.02em |
| H2 (Section) | 32px / 2rem | 700 | 1.3 | -0.01em |
| H3 (Card title) | 24px / 1.5rem | 600 | 1.3 | 0 |
| H4 (Subsection) | 20px / 1.25rem | 600 | 1.4 | 0 |
| Body | 16px / 1rem | 400 | 1.6 | 0 |
| Body Small | 14px / 0.875rem | 400 | 1.5 | 0 |
| Caption | 12px / 0.75rem | 500 | 1.4 | 0.02em |
| Button | 16px / 1rem | 600 | 1 | 0.01em |

### Typography Rules

- **Minimum body text:** 16px (accessibility for older users and stressed readers).
- **Hebrew text direction:** Always set `dir="rtl"` on Hebrew content blocks.
- **Mixed-direction text:** Use `<bdi>` tags or CSS `unicode-bidi: isolate` for inline mixed-direction strings.
- **Line height for Hebrew:** Use at least 1.6 to prevent collision of diacritics (nikud).
- **Never** use font weights below 400 — thin text is hard to read for the target audience.

---

## 5. SPACING & LAYOUT

### Spacing Scale (base unit: 4px)

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight inner padding |
| `sm` | 8px | Icon gaps, tag padding |
| `md` | 16px | Standard component padding |
| `lg` | 24px | Card padding, section gaps |
| `xl` | 32px | Section spacing |
| `2xl` | 48px | Major section separators |
| `3xl` | 64px | Page section breaks |

### Border Radius (from research: "Principle of Corner Dynamics")

| Element Type | Radius | Rationale |
|-------------|--------|-----------|
| Info blocks, inputs | `8px` | Slightly rounded — structured but not sharp |
| Cards, modals | `16px–20px` | Generous — soft, touchable, game-like |
| Buttons (CTA) | `20px–24px` | High — playful, inviting to click |
| Tags, badges, pills | `9999px` (full pill) | Dynamic, soft, noticeable |
| Avatars | `50%` (circle) | Standard for profile images |
| Hero/feature images | `24px` | Extra soft — friendly and approachable |

### Layout Rules

- **Max content width:** 1200px centered with auto margins.
- **Card grid:** Use CSS Grid with `gap: 24px`, columns `repeat(auto-fit, minmax(300px, 1fr))`.
- **Touch targets:** Minimum 44×44px for all interactive elements.
- **White space:** Be generous. Empty space reduces cognitive load for stressed users.
- **Mobile first:** Design for 375px width minimum, scale up.

---

## 6. COMPONENT PATTERNS

### Buttons

```css
/* Primary CTA — gradient for dimension */
.btn-primary {
  background: linear-gradient(135deg, #005871 0%, #004559 100%);
  color: #FFFFFF;
  font-family: 'Rubik', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 12px 28px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
}
.btn-primary:hover { background: linear-gradient(135deg, #004559 0%, #003A4C 100%); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }

/* Secondary — Electric Cyan accent */
.btn-secondary {
  background: transparent;
  color: #33BECC;
  border: 2px solid #33BECC;
  font-family: 'Rubik', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 10px 28px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-secondary:hover { background: #33BECC; color: #FFFFFF; }

/* Warm / Social action — luminous coral gradient */
.btn-warm {
  background: linear-gradient(135deg, #FF7F50 0%, #FF6B4A 100%);
  color: #FFFFFF;
  font-family: 'Rubik', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 12px 28px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
}
.btn-warm:hover { background: linear-gradient(135deg, #FF6B4A 0%, #E5673D 100%); transform: translateY(-1px); }
```

### Cards

```css
.card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 28px;
  border: 1px solid rgba(0, 88, 113, 0.08);            /* crisp definition */
  box-shadow: 0 2px 12px rgba(0, 88, 113, 0.06);       /* tight, engineered shadow */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-3px) rotate(-0.5deg);  /* slight playful tilt */
  box-shadow: 0 4px 16px rgba(0, 88, 113, 0.10);
}
```

### Tags / Pills

```css
.tag {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 9999px;
  font-family: 'Rubik', sans-serif;
  font-size: 13px;
  font-weight: 500;
}
.tag-teal { background: rgba(51, 190, 204, 0.15); color: #005871; }
.tag-warm { background: rgba(255, 127, 80, 0.15); color: #FF7F50; }
.tag-yellow { background: rgba(220, 212, 148, 0.25); color: #6B5E00; }
```

### Input Fields

```css
.input {
  font-family: 'Rubik', sans-serif;
  font-size: 16px;
  padding: 12px 16px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  background: #FFFFFF;
  color: #1A1A1A;
  transition: border-color 0.2s ease;
}
.input:focus { border-color: #33BECC; outline: none; box-shadow: 0 0 0 3px rgba(51, 190, 204, 0.15); }
```

---

## 7. SHADOWS & ELEVATION

| Level | Shadow | Usage |
|-------|--------|-------|
| Subtle | `0 1px 3px rgba(0,88,113,0.04)` | Tags, small elements |
| Default | `0 2px 12px rgba(0,88,113,0.06)` | Cards, content blocks |
| Raised | `0 4px 16px rgba(0,88,113,0.10)` | Hover states, dropdowns |
| Modal | `0 16px 48px rgba(0,88,113,0.15)` | Modals, overlays |

Shadow color is always based on `#005871` (brand blue), never pure black.

---

## 8. ICONOGRAPHY

- **Style:** Rounded outline icons (not filled, not sharp). Match Rubik's friendly geometry.
- **Recommended set:** Lucide Icons (rounded variant) or Phosphor Icons (regular weight).
- **Size:** 20px for inline, 24px for navigation, 32px for feature highlights.
- **Color:** Inherit from text color, or use `#33BECC` for decorative/accent icons.
- **Directional icons (arrows, back):** Must flip horizontally in RTL mode.
- **Non-directional icons (camera, star, checkmark):** Do NOT flip in RTL mode.

---

## 9. RTL / BIDIRECTIONAL RULES

Since the app supports Hebrew (RTL) alongside Russian and English (LTR):

- Set `dir="rtl"` on the root `<html>` tag when the user selects Hebrew.
- Use CSS logical properties: `margin-inline-start` instead of `margin-left`, `padding-inline-end` instead of `padding-right`, etc.
- Flexbox layouts with `gap` auto-adapt to direction — prefer flex/grid over absolute positioning.
- **Mirror:** Navigation arrows, progress bars, swipe indicators.
- **DO NOT mirror:** Media playback controls, phone number fields, logos, clocks.
- Test every layout in both directions.

---

## 10. MOTION & MICRO-INTERACTIONS

- **Transitions:** `0.2s ease` for hover/focus, `0.3s ease` for layout changes.
- **Hover on cards:** Subtle lift (`translateY(-2px)`) + shadow increase.
- **Button press:** Scale down slightly (`scale(0.98)`) on `:active`.
- **Page transitions:** Fade-in with `opacity 0→1` over `0.3s`.
- **Success celebrations:** Brief confetti or sparkle animation on achievements (first message sent, first match, etc.).
- **Typing indicator:** Three pulsing dots (`#33BECC`) in chat — important ice-breaker mechanic.
- **Skeleton screens:** Use shimmering placeholders (`#E0E0E0` → `#F0F0F0` pulse) instead of spinners while loading.
- **Avoid** aggressive or complex animations — many users may have reduced motion preferences.
- Respect `prefers-reduced-motion: reduce` — disable non-essential animations.

---

## 11. DARK THEME

When implementing dark mode, remap as follows:

| Element | Light Theme | Dark Theme |
|---------|-------------|------------|
| Page background | `#F0F0F0` | `#1A1A1A` |
| Card surface | `#FFFFFF` | `#2A2A2A` |
| Primary text | `#1A1A1A` | `#F0F0F0` |
| Secondary text | `#6B7280` | `#9CA3AF` |
| Lyons Blue (brand) | `#005871` | `#33BECC` (swap: accent becomes primary in dark) |
| Borders | `#E0E0E0` | `#3A3A3A` |
| Shadows | `rgba(0,88,113,0.06)` | `rgba(0,0,0,0.3)` |

The logo switches to the **dark variant** (Section 2B) on dark backgrounds — white center node, brand-colored "B". The satellite nodes and connection lines remain full-color on both themes.

---

## 12. SLOGAN (use separately from logo)

| Language | Text |
|----------|------|
| Hebrew | הקשר שלך לקהילה חדשה |
| Russian | Твоя связь с новым сообществом |
| English | Your connection to a new community |

Display in Rubik 400, color `#FF7F50` (Vivid Coral). The slogan is never baked into the logo SVG — always render as a separate text element.

---

## 13. CSS VARIABLES TEMPLATE

Copy this into any project for instant brand consistency:

```css
:root {
  /* Brand Colors */
  --color-primary: #005871;
  --color-primary-hover: #004559;
  --color-accent: #33BECC;
  --color-warm: #FF7F50;
  --color-warm-hover: #E5673D;
  --color-highlight: #DCD494;
  
  /* Backgrounds — WARM, never sterile */
  --color-bg: #F7F4F0;           /* warm cream — primary page bg */
  --color-bg-alt: #EDF8F9;       /* teal tint — alternating sections */
  --color-bg-warm: rgba(255, 127, 80, 0.06); /* coral whisper for warm sections */
  --color-surface: #FFFFFF;
  --color-text: #1A1A1A;
  --color-text-secondary: #6B7280;
  --color-border: #E8E2DC;       /* warm-tinted border, not cold gray */
  
  /* Semantic */
  --color-success: #4CAF50;
  --color-error: #E53935;
  --color-warning: #FFA726;
  --color-info: #33BECC;
  
  /* Typography */
  --font-family: 'Rubik', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  --font-size-3xl: 48px;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  
  /* Radius — generous and soft */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-card: 20px;
  --radius-btn: 22px;
  --radius-pill: 9999px;
  
  /* Shadows — warm-tinted, never cold */
  --shadow-subtle: 0 1px 4px rgba(0,88,113,0.04);
  --shadow-default: 0 2px 12px rgba(0,88,113,0.06);
  --shadow-raised: 0 4px 16px rgba(0,88,113,0.10);
  --shadow-modal: 0 16px 48px rgba(0,88,113,0.15);
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
}

/* Dark theme override */
[data-theme="dark"] {
  --color-primary: #33BECC;
  --color-bg: #1A1A1A;
  --color-bg-alt: #222222;
  --color-surface: #2A2A2A;
  --color-text: #F0F0F0;
  --color-text-secondary: #9CA3AF;
  --color-border: #3A3A3A;
  --shadow-default: 0 4px 20px rgba(0,0,0,0.3);
  --shadow-raised: 0 8px 30px rgba(0,0,0,0.4);
}
```

---

## 14. CHECKLIST FOR AI AGENTS

When generating any UI for בקשר, verify:

**Creative Direction (most important):**
- [ ] Does it feel like a living room, NOT an office? (See Section 0)
- [ ] Page background is warm (`#F7F4F0`), NOT plain white
- [ ] Sections alternate between warm cream and teal-tinted backgrounds
- [ ] Vivid Coral (#FF7F50) is visibly present — not just blue everywhere
- [ ] Decorative dots/circles from the palette are scattered as background texture
- [ ] Cards have generous border-radius (20px) and warm-tinted shadows
- [ ] Language is casual and encouraging, not corporate
- [ ] No stock-photo hero banners or "Learn More" generic CTAs
- [ ] Some element of playfulness: emoji, slight tilts, overlapping shapes, avatar groups

**Technical Specs:**
- [ ] Logo SVG is embedded exactly as provided (Section 2A), not redrawn
- [ ] Font is Rubik loaded from Google Fonts
- [ ] Colors match the hex values in Section 3 exactly
- [ ] Primary CTA buttons are `#005871` with `border-radius: 22px`
- [ ] No pure black (`#000000`) used anywhere — use `#1A1A1A`
- [ ] Touch targets are minimum 44×44px
- [ ] Body text is minimum 16px
- [ ] CSS variables from Section 13 are included
- [ ] RTL support is considered if Hebrew text is present
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Slogan is separate from logo, in Rubik 400, color `#FF7F50`
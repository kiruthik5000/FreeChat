# Chat application — UI build prompt for coding agent

Copy everything below into your agent (Claude Code / Cursor / etc.) as the build spec.

---

## Prompt to give your agent

```
Build a modern, polished chat application UI (React + Tailwind CSS). Follow this 
specification exactly — it covers layout, color system, typography, icon behavior, 
and interaction details. Do not deviate from the constraints listed under "Hard 
constraints."

HARD CONSTRAINTS
- No emoji anywhere in the UI — not in icons, placeholders, empty states, or 
  microcopy. Use outline icon fonts/SVGs only (e.g. lucide-react or Tabler icons).
- Font: SF Pro family for all text. See "Typography" section for the exact font 
  stack and fallback strategy (SF Pro is an Apple system font and is not 
  redistributable for general web embedding — implement the fallback stack below 
  so it still renders as true SF Pro on Apple devices and a near-identical 
  alternative everywhere else).
- All icons must use the hover micro-interaction system described in "Icon 
  animation system" — every clickable icon, no exceptions.
- Respect prefers-reduced-motion: reduce by disabling all transform transitions 
  for users who have that OS setting on.

LAYOUT
Three-pane structure:
1. Left sidebar (260px, collapsible to icon-only 64px rail on mobile/tablet):
   - App logo/mark at top
   - "New chat" button (primary action, full width, icon + label)
   - Search input (icon-prefixed)
   - Scrollable conversation list, grouped by Today / Yesterday / Previous 7 days
   - User profile + settings icon pinned at bottom
2. Main chat pane (flex-1):
   - Sticky header: conversation title (editable inline on click), overflow 
     menu icon (rename/delete/export)
   - Scrollable message list, auto-scrolls to bottom on new message, 
     "jump to latest" pill button appears when scrolled up
   - Message bubbles: sender's messages right-aligned with accent fill, 
     receiver's left-aligned with neutral surface fill. Max width 70% of pane.
   - Typing indicator: three animated dots, no emoji, subtle pulse animation
   - Input area docked at bottom: auto-growing textarea, icon-only buttons for 
     attach/emoji-picker-toggle (icon only, app itself produces no emoji content) 
     and send, character/token count optional
3. Optional right panel (collapsible, 320px): conversation details, shared 
   files, or thread info — hidden by default, slides in on toggle.

Responsive behavior: sidebar collapses to a slide-over drawer below 768px width. 
Right panel hidden entirely below 1024px.

COLOR SYSTEM
Implement as CSS custom properties so the whole theme can be swapped by changing 
one block. Build light and dark mode variants for whichever palette is chosen 
(see "Color palette options" below for the three choices — default to Option A 
unless told otherwise).

TYPOGRAPHY
Font stack (apply to a CSS variable --font-sans and use it as the base font 
for the whole app):
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", 
    "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
- -apple-system / BlinkMacSystemFont render as true San Francisco on macOS, 
  iOS, iPadOS, and Safari/Chrome on Apple devices — no font file needed there.
- "SF Pro Display"/"SF Pro Text" only resolve if the user has them locally 
  installed (they ship with Apple devices) — include them as named fallbacks 
  in case the OS exposes them under that name, but do not attempt to @font-face 
  load SF Pro from a CDN or self-hosted file; Apple's license does not permit 
  redistributing SF Pro for general web use.
- "Inter" is the cross-platform fallback — visually closest open-license match 
  to SF Pro's proportions and x-height, used on Windows/Linux/Android. Load it 
  via Google Fonts or self-host the variable font file.
Type scale: 
  --text-xs: 12px; --text-sm: 13px; --text-base: 15px; --text-lg: 17px; 
  --text-xl: 20px; --text-2xl: 24px;
  Body text line-height: 1.5. Message bubble text: 15px/1.5.
Weights: use only 400 (regular) and 500 (medium/semibold) — avoid 700+, it 
reads heavy against a clean chat UI.

ICON ANIMATION SYSTEM
Every interactive icon (sidebar items, header actions, send button, message 
action icons, etc.) must use this exact transition:
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease;
Apply per icon role:
- Navigation / utility icons (settings, search, collapse): scale(1.1) + accent 
  color on hover.
- Send button icon: translateY(-2px) + accent color on hover; on click, briefly 
  scale(0.9) then back to 1 (tactile press feedback).
- Destructive icons (delete conversation): no scale-up; instead a subtle 
  rotate(-8deg) and color shift to the danger color, to read as "caution" 
  rather than "exciting."
- Copy-to-clipboard icon: swap to a checkmark icon on click via opacity/scale 
  crossfade (200ms), then revert after 1.5s.
- New message / notification icon: a one-time spring bounce 
  (cubic-bezier(0.68, -0.6, 0.32, 1.6), scale 1 → 1.25 → 1) when a new message 
  arrives, not on every hover.
Keep every transition duration between 150–250ms. Disable all of the above 
under @media (prefers-reduced-motion: reduce).

COMPONENT DETAILS
- Message bubbles: border-radius 16px, with the corner nearest the sender's 
  avatar slightly squared (4px) to indicate direction, like a speech-tail 
  without drawing an actual tail.
- Avatars: initials-based circular avatars with a deterministic color from 
  the palette's accent ramp, generated from the user's name hash — consistent 
  per user, no actual photos required by default.
- Buttons: primary (filled accent) used once per view max; everything else 
  is ghost or outline style. Hover states use background tint, not box-shadow.
- Empty states (no conversations yet, no messages yet): plain text + one 
  outline icon, no decorative illustration needed, definitely no emoji.
- Loading state for AI/streaming responses: animated three-dot indicator, 
  same accent color as the bubble fill.

ACCESSIBILITY
- All icon-only buttons get aria-label.
- Focus-visible rings on every interactive element (2px accent outline, 2px 
  offset).
- Color contrast: body text vs background must meet WCAG AA (4.5:1) in both 
  light and dark mode.

Build this as a working React component tree with Tailwind utility classes, 
using CSS variables for the color tokens so the theme is swappable later.
```

---

## Color palette options

Pick one and tell the agent which (or paste the full hex block from your choice into the prompt above, in place of "see Color palette options below").

### Option A — Warm neutral (recommended default)
Soft, approachable, good for a consumer-facing chat app.

| Token | Light mode | Dark mode |
|---|---|---|
| `--bg-page` | `#FAF8F4` | `#1A1815` |
| `--bg-surface` | `#FFFFFF` | `#242220` |
| `--bg-sidebar` | `#F3EFE7` | `#1F1D1A` |
| `--accent` | `#D85A30` (terracotta) | `#E8784F` |
| `--accent-fill-text` | `#FFFFFF` | `#1A1815` |
| `--text-primary` | `#262420` | `#F2EFE9` |
| `--text-secondary` | `#6B6760` | `#B8B2A8` |
| `--border` | `#E5E0D6` | `#34312C` |
| `--danger` | `#C0392B` | `#E0635A` |

### Option B — Cool slate
Calmer, more "productivity tool" feel, good for B2B/internal chat tools.

| Token | Light mode | Dark mode |
|---|---|---|
| `--bg-page` | `#F5F7FA` | `#13161B` |
| `--bg-surface` | `#FFFFFF` | `#1C2027` |
| `--bg-sidebar` | `#EBEEF2` | `#171A1F` |
| `--accent` | `#3478D8` (electric blue) | `#5B9BF0` |
| `--accent-fill-text` | `#FFFFFF` | `#0B0E12` |
| `--text-primary` | `#1B1F26` | `#E9ECF1` |
| `--text-secondary` | `#697180` | `#9AA3B0` |
| `--border` | `#DCE1E8` | `#2A2F38` |
| `--danger` | `#D94343` | `#F0635A` |

### Option C — Monochrome + single accent
Maximum restraint, very "design-forward" look — works well if you want the UI 
to feel premium and minimal.

| Token | Light mode | Dark mode |
|---|---|---|
| `--bg-page` | `#FFFFFF` | `#0E0E0E` |
| `--bg-surface` | `#F7F7F7` | `#181818` |
| `--bg-sidebar` | `#F0F0F0` | `#141414` |
| `--accent` | `#6E56CF` (violet) | `#8B74E8` |
| `--accent-fill-text` | `#FFFFFF` | `#0E0E0E` |
| `--text-primary` | `#111111` | `#F2F2F2` |
| `--text-secondary` | `#6F6F6F` | `#A0A0A0` |
| `--border` | `#E5E5E5` | `#2A2A2A` |
| `--danger` | `#D33636` | `#E85E5E` |

---

## Notes

- **SF Pro caveat:** Apple's SF Pro is not licensed for general web distribution. 
  The font stack in the prompt above gets you true SF Pro on Apple 
  devices automatically (via `-apple-system`) and falls back to Inter — the 
  closest open-source match in proportions — everywhere else. If you have an 
  Apple Developer account, you can self-host SF Pro for an app's *internal* use, 
  but it can't ship in a public web build under Apple's license terms.
- Tell the agent your actual stack if it's not plain React + Tailwind (e.g. 
  Next.js, Vite, shadcn/ui) — the spec is framework-agnostic but the prompt 
  assumes React + Tailwind since that's your usual setup.

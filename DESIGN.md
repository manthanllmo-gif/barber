# Design System: Uber Modern (Minimalist)

This document defines the visual language and design tokens for the TrimTime Queue Management System, inspired by the high-contrast, utility-first aesthetic of modern logistics and transportation apps (Uber/Base Web).

## Visual Identity
**Vibe**: Modern, Minimalist, High-Contrast, Utility-First, Professional.
**Styling Principles**: Clean lines, High contrast (Black/White), Sharp corners (4-8px), Strict hierarchy, and Substantial whitespace.

## Color Palette
| Token | Role | Hex |
|-------|------|-----|
| `primary` | Core Brand / Main Buttons | `#000000` (Pure Black) |
| `primary-content` | Text on Primary | `#FFFFFF` (Pure White) |
| `accent` | Links / Active States | `#276EF1` (Uber Blue) |
| `background` | Page Body | `#FFFFFF` (Pure White) |
| `surface` | Card / Section Background | `#F6F6F6` (Light Grey) |
| `border` | Dividers / Outlines | `#EEEEEE` |
| `text-main` | Headings / Labels | `#000000` |
| `text-muted` | Metadata / Secondary | `#545454` |
| `success` | Active Tokens / Complete | `#05A357` |
| `warning` | Waiting Tokens / Action Req | `#FFC043` |
| `danger` | Canceled / Urgent | `#E11900` |

## Typography
- **Primary Font**: `Inter`, sans-serif (High technical readability)
- **Hierarchy**:
    - **H1**: Bold, tracking -2%, tight line height.
    - **Labels**: Medium weight, all-caps for small metadata.
    - **Numbers**: Tabular numerals for timers and token IDs.

## Components
### Cards
- **Radius**: `20px` (Organic/Premium)
- **Border**: `1px solid #EEEEEE`
- **Shadow**: `0 10px 40px rgba(0,0,0,0.1)`
- **Padding**: Large (24px - 32px) to emphasize whitespace.
- **Background**: Subtle mesh gradients (`#FFFFFF` to `#F3F3F3`)

### Buttons
- **Primary**: Gradient background (`#276EF1` to `#1E1E2E`), white text, 12px radius, bold.
- **Secondary**: Transparent background, 1px black border, black text, 12px radius.
- **Ghost**: No border/background, blue text (for secondary actions).

### Inputs
- **Style**: Outlined, 1px grey border, focus state with 2px black border, 12px radius.
- **Background**: White or very light grey.

## Development Guidelines
- **Layout**: Use CSS Grid for strict alignment. 
- **Icons**: Use clean, stroke-based icons (Lucide/Phosphor) in black or blue.
- **Animations**: Fast, linear transitions (150ms). No "bouncy" or overly "organic" motion.
- **Styling**: Always use Tailwind CSS v4.

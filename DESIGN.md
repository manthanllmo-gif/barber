# Design System: TrimTime Premium

This document defines the visual language and design tokens for the TrimTime Queue Management System.

## Visual Identity
**Vibe**: Premium SaaS, Minimalist, High-Contrast, Professional, and Trustworthy.
**Styling Principles**: Glassmorphism, Rounded Corners (16px default), Soft Shadows, and Smooth Transitions.

## Color Palette
| Token | Role | Hex |
|-------|------|-----|
| `primary` | Brand & Main Actions | `#6366f1` (Electric Indigo) |
| `primary-hover` | Action States | `#4f46e5` |
| `secondary` | Subtext & Layout | `#94a3b8` (Slate Blue) |
| `success` | Active/Completed | `#10b981` (Emerald) |
| `warning` | Pending Tokens | `#f59e0b` (Amber) |
| `danger` | Skipped/No-show | `#f43f5e` (Rose) |
| `background` | Page Body | `#f8fafc` (Soft Mist) |
| `surface` | Card Background | `#ffffff` (Pure White) |
| `text-main` | Headings | `#0f172a` (Deep Slate) |
| `text-muted` | Body/Metadata | `#475569` |

## Typography
- **Headings**: `Outfit`, sans-serif (Modern, bold, geometric)
- **Body**: `Inter`, sans-serif (High readability, neutral)

## Components
### Cards
- **Radius**: `16px`
- **Border**: `1px solid #e2e8f0`
- **Shadow**: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- **Glass**: `backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.7);`

### Buttons
- **Primary**: Indigo background, white text, 12px radius, medium weight.
- **Secondary**: Slate border, slate text, transparent background.
- **Interaction**: Subtle `scale(0.98)` on click, `translateY(-1px)` on hover.

## Real-World Readiness Features
- **Micro-animations**: Subtle lifts and fade-ins for state changes.
- **Live Indicators**: Glowing pulse animations for "Now Serving" items.
- **Countdown Timers**: Real-time MM:SS tickers for estimated wait times.

## Development Guidelines
- **Browser Automation**: Do NOT open the browser automatically for verification. The user will open the browser manually and provide feedback/updates.
- **Styling**: Always use Tailwind CSS v4 and respect the premium cinematic aesthetic defined in this document.

---
name: Sihang Research Workbench
description: A restrained, evidence-first workspace for longitudinal earnings research.
colors:
  accent-indigo: "#5D55D6"
  accent-indigo-dark: "#4840BD"
  canvas-cool: "#F7F8FA"
  surface-white: "#FFFFFF"
  surface-subtle: "#F1F3F6"
  ink-primary: "#17181B"
  ink-muted: "#68707D"
  border-neutral: "#E0E3E8"
  positive: "#067647"
  negative: "#B42318"
  warning: "#B54708"
  company-yellow: "#FFD100"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "42px"
    fontWeight: 640
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 660
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.4
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 620
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-indigo}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "9px 13px"
  button-primary-hover:
    backgroundColor: "{colors.accent-indigo-dark}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "9px 13px"
  control-selected:
    backgroundColor: "{colors.ink-primary}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "9px 10px"
  panel:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "18px"
---

# Design System: Sihang Research Workbench

## Overview

**Creative North Star: "The Analyst's Ledger"**

The system should feel like an analyst's continuously maintained ledger: every number belongs to a period, every interpretation belongs to a module, and every judgment exposes its evidence. It borrows the ordered density of a professional leaderboard while preserving the quieter rhythm needed for long-form company research.

This is a product surface, so the interface disappears into the work. It explicitly rejects the old page's portfolio-scale headlines, saturated purple-and-yellow marketing treatment, dark campaign sections, card walls, and decorative pills. Responsive behavior changes structure rather than shrinking typography theatrically.

**Key Characteristics:**

- Compact global company and quarter controls
- Flat, bordered data surfaces with minimal elevation
- Tables before cards when values need comparison
- One indigo interaction accent, with semantic status colors
- Nine modules grouped into a three-stage evidence chain

## Colors

The palette is a cool neutral ledger with a single indigo interaction voice; semantic colors appear only when a state or analytical direction requires them.

### Primary

- **Research Indigo:** current selection, focus, primary actions, and the small amount of navigational emphasis permitted on each screen.
- **Deep Research Indigo:** hover and active reinforcement for primary controls.

### Secondary

- **Meituan Signal Yellow:** company identity marker and confidence scale only; it never becomes a general interface accent.

### Neutral

- **Cool Canvas:** application background that separates the work surface from navigation.
- **Paper Surface:** tables, modules, and navigation surfaces.
- **Quiet Toolbar:** table headers, toolbars, and secondary controls.
- **Primary Ink:** headings and decision-critical values.
- **Muted Ledger Ink:** metadata, descriptions, and secondary labels.
- **Neutral Rule:** table dividers and structural boundaries.

### Named Rules

**The One Interaction Voice Rule.** Research Indigo is reserved for current selection, focus, and primary action; it must not become decoration.

**The Company Color Boundary.** Meituan Signal Yellow identifies Meituan only. Future companies receive their own small identity marker without recoloring the application chrome.

## Typography

**Display Font:** Inter (with system sans-serif fallbacks)

**Body Font:** Inter (with system sans-serif fallbacks)

**Label/Mono Font:** Inter with tabular numerals for financial values

**Character:** A single sans family keeps the product familiar and reduces hierarchy noise. Weight, alignment, tabular numerals, and restrained scale changes do the organizational work.

### Hierarchy

- **Display** (640, 42px, 1.12): report title on desktop only; 32px on narrow screens.
- **Headline** (660, 24px, 1.25): major workbench sections.
- **Title** (650, 14px, 1.4): module and table-row emphasis.
- **Body** (400, 12px, 1.6): analytical explanation; prose stays near 70 characters when unconstrained.
- **Label** (620, 10px, 0.04em): metadata and table headers; uppercase is limited to short English section keys.

### Named Rules

**The Fixed Product Scale Rule.** No fluid display typography and no headings larger than 42px. Density must remain stable across the application.

## Elevation

The system is flat by default. Depth comes from cool canvas versus white surface, one-pixel borders, and sticky positioning. A two-pixel ambient shadow is permitted only on the global header; resting cards and tables have no shadow.

### Shadow Vocabulary

- **Header Float** (`0 1px 2px rgb(16 24 40 / 0.06)`): separates the sticky global control bar from scrolling research content.

### Named Rules

**The Flat Ledger Rule.** If a resting panel needs a shadow to be understood, its border or hierarchy is wrong.

## Components

Components are refined and restrained. Every control uses familiar product behavior, a six- or eight-pixel corner, and a visible keyboard focus ring.

### Buttons

- **Shape:** gently squared (6px radius).
- **Primary:** Research Indigo with white text and compact 9px × 13px padding.
- **Hover / Focus:** Deep Research Indigo on hover; a two-pixel Research Indigo focus outline offset by two pixels.
- **Secondary / Ghost:** neutral or transparent at rest, Quiet Toolbar on hover.

### Chips

- **Style:** compact rectangular status labels (4px radius), never generic decorative pills.
- **State:** text always names the state; color is supplementary.

### Cards / Containers

- **Corner Style:** restrained (8px radius).
- **Background:** Paper Surface on Cool Canvas.
- **Shadow Strategy:** none at rest.
- **Border:** one-pixel Neutral Rule.
- **Internal Padding:** 14–22px depending on information density.

### Inputs / Fields

- **Style:** native selects inside the persistent header, visually simplified but not behaviorally reinvented.
- **Focus:** two-pixel Research Indigo outline.
- **Error / Disabled:** semantic label plus color; never color alone.

### Navigation

The desktop application uses a sticky top bar and a persistent research-library sidebar. Below 920px the sidebar becomes a compact horizontal library; below 700px period controls simplify and wide analytical tables scroll horizontally. Active company, period, and module states remain textually explicit.

### Nine-Module Directory

The signature component groups nine modules into three bordered ledgers: Financial Facts, Operating Explanation, and Investment Judgment. Each group owns exactly three modules, with one active module shown in a detailed panel below.

## Do's and Don'ts

### Do:

- **Do** default to the latest report and keep company and quarter selectors globally visible.
- **Do** use semantic tables whenever values share columns or require comparison.
- **Do** preserve 10–14px product typography, tabular numerals, and one-pixel structural rules.
- **Do** group all nine modules into the same three-stage evidence chain.
- **Do** provide visible focus states, reduced-motion behavior, and text labels for positive, negative, and neutral states.

### Don't:

- **Don't** reproduce the old page's portfolio-style oversized headline, saturated purple-and-yellow marketing feel, or dark campaign sections.
- **Don't** create a card wall or wrap every datum in an independent rounded card.
- **Don't** use SaaS landing-page slogans, decorative gradients, glass navigation, or heavy shadows.
- **Don't** scatter decorative pill labels across the interface; status labels must describe a real state.
- **Don't** invent non-standard selectors, tables, or navigation for flavor.
- **Don't** use company identity colors as application-wide accents.

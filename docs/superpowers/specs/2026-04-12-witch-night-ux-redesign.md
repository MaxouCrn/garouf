# Witch Night UX Redesign

**Date:** 2026-04-12
**Component:** `components/online/WitchActionView.tsx`

## Problem

Two potion GCardFrame cards side-by-side have misaligned heights when button text wraps differently ("Sauver la cible" = 2 lines vs "Tuer Emma" = 1 line). This also breaks corner accent positioning.

## Solution

Separate potion visuals (status cards) from action buttons. Cards stay side-by-side as compact status indicators with identical content structure (guaranteed same height). Action buttons are full-width below — text length no longer matters.

## Screen Structure (top to bottom)

### 1. Header
- Title "La Sorcière" (existing style)
- ActionTimer (existing component, unchanged)

### 2. Victim Banner
- GCardFrame variant="glass" with corners
- Shows skull icon, "Victime des loups" label, victim name in danger color
- Or "Aucune victime cette nuit" if no werewolf target
- **No changes from current implementation**

### 3. Potion Status Cards (row)
Two cards side-by-side in a flexDirection row with equal flex.

Each card contains (vertically centered):
- Potion image (`health-potion.png` for life, `poison-potion.png` for death)
- Title ("Vie" / "Mort")
- Availability indicator: green dot if available, "Épuisée" badge if depleted

Card styling:
- GCardFrame variant="glass" with corners
- cornerColor: `colors.danger` for life, `colors.success` for death
- Life background: `rgba(90,30,30,0.45)` with `rgba(233,69,96,0.4)` border
- Death background: `rgba(30,70,30,0.45)` with `rgba(78,204,163,0.4)` border
- Depleted: opacity 0.4, neutral background/border

**No buttons inside cards.** Content structure is identical between both cards, so heights always match.

### 4. Action Buttons (vertical stack, full-width)
Displayed conditionally based on potion availability:

**Life action** (shown if potion available AND werewolf target exists):
- Default state: "Sauver la cible" — neutral button style (rgba white bg, white border)
- Active state: danger-colored bg/border, same text, + "Appuyer pour annuler" subtitle

**Death action** (shown if potion available):
- Default state: "Empoisonner" — neutral button style
- Active state: success-colored bg/border, text changes to "Tuer {victimName}", + "Appuyer pour annuler" subtitle

**Not shown** if the corresponding potion is depleted.

### 5. Bottom Area
- Recap container (if any action selected): lists chosen actions
- "Confirmer" button (if any action selected) or "Ne rien faire" button
- **No changes from current implementation**

## Activation Feedback (dual feedback)

When an action is toggled on:

**Card reaction:**
- Border becomes more vivid (increase border opacity/brightness)
- Subtle glow via shadow (shadowColor matching potion color, shadowRadius ~10)
- Pulse animation continues (existing `usePotionPulse` hook)

**Button reaction:**
- Background fills with potion color (danger for life, success for death)
- Border becomes solid potion color
- Text updates (poison: "Empoisonner" → "Tuer {name}")
- "Appuyer pour annuler" subtitle appears below action text

## What Does NOT Change

- `GCardFrame` component itself — no modifications needed
- Modal for poison target selection (bottom sheet)
- Game logic (heal/killTargetId state, handleSubmit, handleTimeout)
- ActionTimer component
- Confirm/pass button logic
- Recap display

## States Matrix

| Life Potion | Death Potion | Life Card | Death Card | Buttons Shown |
|---|---|---|---|---|
| Available, no target | Available | Neutral, hint "Personne à sauver" | Neutral | Empoisonner only |
| Available, target exists | Available | Neutral | Neutral | Sauver + Empoisonner |
| Available, heal active | Available | Glowing | Neutral | Sauver (active) + Empoisonner |
| Available | Kill selected | Neutral | Glowing | Sauver + Tuer {name} (active) |
| Both active | Both active | Glowing | Glowing | Sauver (active) + Tuer {name} (active) |
| Depleted | Available | Dimmed + badge | Neutral | Empoisonner only |
| Available | Depleted | Neutral | Dimmed + badge | Sauver only |
| Depleted | Depleted | Dimmed + badge | Dimmed + badge | None (just Ne rien faire) |

## Files Modified

- `components/online/WitchActionView.tsx` — full rewrite of JSX layout and styles, logic unchanged
- `app/dev.tsx` — update mock props if WitchActionView preview exists

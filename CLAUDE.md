# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npx expo start          # Start Expo dev server (scan QR with Expo Go)
npx expo start --ios    # Run on iOS simulator
npx expo start --android # Run on Android emulator
```

## Testing

```bash
npx jest                                    # Run all tests
npx jest __tests__/gameReducer.test.ts      # Run game logic tests
npx jest --watch                            # Watch mode
```

Jest is configured with `ts-jest` and `react-jsx` transform in `jest.config.js`. Tests for pure logic (reducer, helpers) use `testEnvironment: "node"`.

## Type Checking

```bash
npx tsc --noEmit
```

## Architecture

**Single-phone game master app** — no backend, all state in memory. One phone orchestrates a Werewolf (Loup-Garou) game; players pass it around to see their roles.

### State Management

All game logic lives in `context/GameContext.tsx`:
- **Types:** `Role`, `Player`, `GamePhase`, `NightStep`, `GameState`, `GameAction`
- **Reducer:** `gameReducer` handles all state transitions (15 action types)
- **Helpers:** `checkWinner()`, `assignRoles()`, `getNextNightStep()` — pure functions, independently testable
- **Context:** `GameProvider` wraps the app, `useGame()` hook for access

Game phases flow linearly: `setup_players` → `setup_roles` → `distribution` → `night` ↔ `day` → `end`, with an optional `hunter` phase triggered when the hunter dies.

### Navigation

expo-router with file-based routing in `app/`. Phase-based navigation uses `useEffect` watching `state.phase` to call `router.replace()` — never call `router.replace()` during render, always in a `useEffect`.

### Screens

All screens are in `app/`. Each screen uses `useGame()` for state and dispatch. The root layout (`app/_layout.tsx`) wraps everything in `GameProvider`.

### Theme

Dark theme colors in `theme/colors.ts`. All screens use `StyleSheet` from React Native directly.

## Commit Rules

- **NEVER** add `Co-Authored-By` lines to git commits. Claude must not appear as a contributor.
- **NEVER** push to remote until the feature is verified working (tests pass, no runtime errors). Commit locally, test, then push only when stable.

## Language

UI text is in French. Code (variables, types, comments) is in English.

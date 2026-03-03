# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn run dev        # Start development server (http://localhost:5173)
yarn run build      # Type-check with tsc, then bundle with Vite
yarn run lint       # Run ESLint
yarn run preview    # Serve the production build locally
```

There is no test runner configured in this project.

## Architecture

This is a **React 19 + TypeScript + Vite** single-page application — a minimal starter template.

- **Entry point**: `index.html` → `src/main.tsx` → `src/App.tsx`
- **Build tool**: Vite 7 with `@vitejs/plugin-react` (Babel-based Fast Refresh)
- **State management**: React built-in hooks only (`useState`, etc.) — no Redux, Zustand, or other libraries
- **Routing**: None configured
- **Styling**: Plain CSS (`src/index.css` for globals, `src/App.css` for component-scoped styles)

## TypeScript

TypeScript strict mode is fully enabled, including `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`. The project uses composite TypeScript config:
- `tsconfig.json` — project references root
- `tsconfig.app.json` — app source (targets ES2022, `moduleResolution: bundler`)
- `tsconfig.node.json` — Vite config file only

## ESLint

Uses ESLint 9 flat config (`eslint.config.js`) with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.

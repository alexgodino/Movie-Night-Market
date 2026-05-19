<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Movie Night Market — AI Agent Instructions

## Project Overview

Movie Night Market is a mobile-first movie voting app designed for casual family and friend movie nights.

Core flow:
1. Admin creates a movie night with 5 movies
2. Users anonymously vote from phones
3. Winning movie is revealed
4. After watching, users submit ratings
5. Results/history may be shown later

The app should feel:
- cinematic
- clean
- cozy
- simple
- fast
- fun

The app is NOT meant to feel like:
- a corporate dashboard
- a productivity tool
- a social network
- an enterprise SaaS product

Prioritize usability and clarity over feature depth.

---

# Tech Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Prisma
- SQLite
- Render deployment

---

# Architecture

General structure:
- `app/` → routes/pages/layouts
- `components/` → reusable UI
- `lib/` → utilities/business logic/helpers
- `prisma/` → schema/migrations
- `public/` → static assets/uploads

Keep responsibilities separated cleanly.

---

# Mobile-First Requirement

This app is primarily used on phones.

Always prioritize:
- large touch targets
- readable text
- vertical layouts
- smooth scrolling
- responsive spacing
- thumb-friendly interactions

Desktop is secondary.

Any voting interaction MUST work reliably on mobile.

---

# UI Philosophy

The UI should:
- feel lightweight
- avoid clutter
- use strong visual hierarchy
- emphasize movie posters
- minimize instructions
- be intuitive without explanation

Prefer:
- large buttons
- clean spacing
- simple transitions
- subtle animations
- dark cinematic UI

Avoid:
- tiny buttons
- excessive forms
- crowded screens
- long paragraphs
- unnecessary modals
- overly flashy animations

Visual inspiration:
- Letterboxd
- streaming apps
- clean theater kiosk interfaces

---

# Voting Rules

Users should:
- remain anonymous
- not need accounts
- vote quickly and easily
- only vote once per category/device

Do NOT introduce authentication systems unless explicitly requested.

Keep voting friction extremely low.

---

# Poster Handling

Poster images may be:
- uploaded manually
- linked manually
- optionally fetched externally

Never assume external APIs are reliable.

Always provide graceful fallbacks for:
- missing posters
- broken image URLs
- slow loading

---

# Code Style

Prefer:
- readable code
- reusable components
- incremental edits
- small focused files
- clear naming
- simple logic
- maintainable structure

Avoid:
- overengineering
- giant abstractions
- unnecessary dependencies
- deeply nested components
- premature optimization
- unnecessary global state

Keep solutions simple unless complexity is clearly justified.

---

# Workflow Expectations

Before making changes:
1. inspect the current implementation
2. understand existing flow
3. preserve working functionality
4. avoid unnecessary rewrites

When modifying UI:
- preserve mobile usability
- maintain visual consistency
- avoid breaking layouts

After major changes:
- run lint
- run build
- verify mobile interactions

---

# Known Issues To Avoid

Previously encountered problems:
- mobile voting buttons not responding
- dark text on dark backgrounds
- posters failing to display
- confusing navigation flow
- cluttered screens
- unreliable mobile layouts
- app reset/sleep issues on free Render tier

Do not reintroduce these issues.

---

# Deployment Constraints

The app is deployed on Render.

Constraints:
- free tier may sleep after inactivity
- persistence may be limited
- keep infrastructure simple
- avoid unnecessary backend complexity

Prefer lightweight solutions.

---

# Admin Experience

Admin workflows should be:
- simple
- fast
- obvious
- low-maintenance

Avoid requiring technical knowledge to run movie night.

---

# Animations

Animations should be:
- subtle
- smooth
- fast
- additive to usability

Avoid:
- excessive motion
- distracting effects
- long animation delays

Simple “stock-market style” movement/flash feedback is preferred over flashy motion design.

---

# When Unsure

Prefer:
- the simpler solution
- the safer edit
- preserving existing functionality
- better mobile UX
- fewer clicks
- cleaner screens

Do not reinvent working systems unless explicitly requested.
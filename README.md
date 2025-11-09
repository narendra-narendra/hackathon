# Sweat Socks Society

Sweat Socks Society is a community hub for finding workout partners, planning events, sharing training stories, and curating recovery gear — all in one place.

Tech stack: Next.js (Pages Router) + TypeScript + Tailwind CSS (preconfigured)

What’s included
- Authenticated dashboard with activity planner, connection suggestions, and previews for events, community feed, and gear picks
- Firebase-powered Events page for hosting and joining meetups
- Community feed for sharing session recaps and cheering teammates
- Curated gear shop with quick filters
- Shared components in `components/` and utilities in `utils/`
- Tailwind CSS config and global styles with color-blind-friendly palette

Quick start (macOS, zsh)

1. Install dependencies:

```bash
# use npm or yarn — npm example
cd /Users/harshithreddy/Desktop/Project
npm install
```

2. Run development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

Notes
- Placeholder images are in `public/` — replace with high-res photos for production.
- Tailwind is preconfigured; run `npx tailwindcss -i ./styles/globals.css -o ./public/output.css` only if you need to build standalone CSS (not necessary when using Next.js dev server).

Next steps
- Implement UI per the design (landing hero, auth flows, dashboard, profile). I can continue and implement the landing page UI next if you want.
# Smart Bijuka web UI

This Astro/React application is a visual prototype for the Smart Bijuka monitoring dashboard. It currently renders mock farm, event, and device telemetry from local fixture files in `src/lib/data/`.

The UI is **not wired to the FastAPI backend** and does not provide live camera, device, or event data. Although Supabase client dependencies and an optional client module exist, a configured, working database integration is not part of this demo baseline.

## Run locally

Requirements: Node.js 20 or later.

```powershell
npm ci
npm run dev
```

Open `http://localhost:4321`. For a production build, run `npm run build`.

Do not treat mock telemetry, battery values, event histories, or device status as live measurements or proof of field operation.

The dependency audit still reports critical/high advisories in the Astro dependency tree after non-breaking updates. Do not expose the development server to untrusted networks; review framework and integration upgrades and re-run `npm audit` before any production deployment.

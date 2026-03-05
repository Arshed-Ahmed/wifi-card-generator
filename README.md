# WiFi Card Generator

A modern Next.js app for creating printable WiFi QR cards for homes, offices, events, and guest networks.

## Highlights

- Generate WiFi QR payloads for WPA/WPA2/WPA3, WEP, or open networks
- Two card templates (`business` and `modern`) with color customization
- Download PNG cards and print-ready layouts
- Encrypted share links for safer guest access
- PWA support (manifest + service worker)
- Built with Next.js App Router, Tailwind CSS, and Radix UI

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- `qrcode.react`
- `html2canvas`

## Quick Start

### Prerequisites

- Node.js `>=18.18.0` (Node 20 recommended)
- npm / pnpm / yarn

### Install

```bash
git clone https://github.com/Arshed-Ahmed/wifi-card-generator.git
cd wifi-card-generator
npm install
```

### Run in Development

```bash
npm run dev
```

Open http://localhost:3000

### Production Build

```bash
npm run build
npm run start
```

## Available Scripts

- `npm run dev` — start development server
- `npm run dev:clean` — clean cache/processes, then run dev server (Windows PowerShell helper)
- `npm run build` — create production build
- `npm run start` — run production server
- `npm run lint` — run linting
- `npm run typecheck` — run TypeScript checks (`tsc --noEmit`)
- `npm run verify` — run typecheck + production build

## Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

`NEXT_PUBLIC_SITE_URL` is used for metadata, sitemap, robots, and canonical URL generation.

## Deployment

### Netlify (recommended)

This repo includes `netlify.toml` with:

- Build command: `npm run build`
- Node version: `20`
- Next.js runtime plugin: `@netlify/plugin-nextjs`

Steps:

1. Import the repo in Netlify.
2. Confirm build command is `npm run build`.
3. Leave publish directory empty (handled by Netlify Next.js plugin).
4. Add env var `NEXT_PUBLIC_SITE_URL` to your Netlify site URL or custom domain.
5. Deploy.

After connecting a custom domain, update `NEXT_PUBLIC_SITE_URL` and redeploy.

## Project Structure

```text
app/
	api/health/route.ts      # Health endpoint
	share/page.tsx           # Secure shared-card page
	page.tsx                 # Main generator UI
components/
	business-card-template.tsx
	modern-card-template.tsx
hooks/
	use-wifi-card-form.ts
	use-wifi-card-actions.ts
lib/
	wifi-qr.ts               # WiFi payload generation
	share-link.ts            # Encrypted share token utils
	site-url.ts              # Site URL helpers
public/
	sw.js                    # Service worker
	pwa/                     # PWA icons
```

## Health Check

- Endpoint: `/api/health`
- Returns service status JSON, timestamp, and uptime

## Troubleshooting

- **Port already in use (`EADDRINUSE`)**
	- Use another port: `npm run start -- -p 3001`
	- Or free port 3000 (Windows):

		```powershell
		Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess
		Stop-Process -Id <PID> -Force
		```

- **Missing build output (`.next`)**
	- Run: `npm run build`

- **Corrupted dev cache or stale chunks**
	- Run: `npm run dev:clean`

- **Modern print popup does not open**
	- Allow pop-ups for your site in the browser settings (used for print rendering flow).

## License

MIT — see [LICENSE](LICENSE).

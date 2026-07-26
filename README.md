# Filary

Chrome extension that fills the **focused form** with realistic data from the Filary API (hosted on Vercel, or run locally).

On trigger, Filary:

1. Locates the focused input (or the last focused input if the popup stole focus)
2. Finds the owning `<form>` (native association, ancestor, or latest form start before the input)
3. Scans that form for named controls and their types (`text`, `email`, `radio`, `checkbox`, …)
4. Sends `{ name, type, options? }` to `POST /api/generate`
5. Fills only that form from the returned values

Controls without a `name` attribute are skipped.

## Prerequisites

- [Bun](https://bun.sh) 1.1+
- Google Chrome (or Chromium)

## Deploy on Vercel (landing + API)

One Vercel project serves:

| Path | What |
| ---- | ---- |
| `/` | Landing page ([`web/`](web/)) |
| `/api/*` | Generator API (serverless → [`api/[...path].ts`](api/[...path].ts) → [`server/src/app.ts`](server/src/app.ts)) |

1. Push this repo and import it in [Vercel](https://vercel.com)
2. Framework Preset: **Other**
3. Install / build use [`vercel.json`](vercel.json) (`bun install`, output `web/`)
4. Deploy

After deploy, note your URL, e.g. `https://filary-xxxx.vercel.app`.

5. Set the extension default API in [`extension/src/shared/config.ts`](extension/src/shared/config.ts):

```ts
export const HOSTED_API_BASE = 'https://YOUR_DEPLOYMENT.vercel.app/api';
```

6. `bun run build`, reload the unpacked extension (or ship the new build)

Smoke-check the hosted API (redeploy after pulling these API route fixes):

```bash
curl https://filary-server.vercel.app/api
curl https://filary-server.vercel.app/api/health
curl -X POST https://filary-server.vercel.app/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"fields":[{"name":"firstName","type":"text"},{"name":"country","type":"text"}],"locale":"en-NG"}'
```

### Extension zip on the landing page

Vercel build runs `bun run release`, which packs `extension/dist` into
`web/filary-extension.zip`. The site’s **Download extension** button points to
`/filary-extension.zip`.

Users: unzip → `chrome://extensions` → Developer mode → **Load unpacked** →
select the `filary` folder.

Later, for the Chrome Web Store, set in [`web/main.js`](web/main.js):

```js
const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/filary/…';
```

## Local development

```bash
bun install
bun run build
bun run server          # API on http://localhost:7002/api
bun run web             # landing on http://localhost:3000
```

In extension Settings, set Server URL to `http://localhost:7002/api` while developing against the local API.

## Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/dist` folder

## Settings

| Setting | Default | Notes |
| ------- | ------- | ----- |
| Server base URL | Hosted Vercel `/api` (see `config.ts`) | Or `http://localhost:7002/api` for local |
| Keyboard shortcuts | macOS: `⌘⇧Y` and `⌥⇧F` | Edit under `chrome://extensions/shortcuts` |
| Fill mode | Empty fields only | Or overwrite matched fields |
| Include passwords | Off | Optional default password |
| Locale | Nigeria (English) `en-NG` | Names, phone, city, state; country fixed per locale |
| Email domains | `gmail.com, yahoo.com, outlook.com` | Used for generated emails |

## Usage

1. Extension points at a running API (Vercel or `bun run server`)
2. Open a page with a `<form>` (try [`demo/sample-form.html`](demo/sample-form.html))
3. Focus a field, then **⌘⇧Y** / **⌥⇧F** or the popup

## How fill works

```
Focus input → resolve <form> → collect name + type
    → POST /api/generate → { values by name } → fill that form only
```

## Project layout

```
web/                    Landing page (Vercel static)
api/                    Vercel serverless entry for /api/*
server/                 Shared Express app (local + Vercel)
extension/              Chrome MV3 → extension/dist
demo/sample-form.html   Manual test form
vercel.json             Static web + serverless API
```

## License

Filary’s own code is available for your use in this repo. TypeServe is AGPL-3.0 — see [typeserve](https://www.npmjs.com/package/typeserve) / [typeserve.com](https://www.typeserve.com/) for details.

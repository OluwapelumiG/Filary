# Filary

Chrome extension that fills the **focused form** with realistic data from a local TypeServe-compatible server.

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

## Setup

### 1. Install and build

```bash
bun install
bun run build
```

### 2. Start the local server

```bash
bun run server
```

This starts the Filary sidecar at `http://localhost:7002/api`.

| Endpoint | Purpose |
| -------- | ------- |
| `POST /api/generate` | **Primary.** Body: `{ fields: [{ name, type, options? }] }` → `{ values }` |
| `GET /api/health` | Connection check for the popup / settings |
| `GET /api/profile` | Debug sample profile (not used by fill) |

Keep this process running while you use the extension.

Stock TypeServe (fixed TypeScript routes only, no dynamic generate):

```bash
bun run --cwd server start:typeserve
```

### 3. Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/dist` folder inside this repo

After code changes, run `bun run build` (or `bun run dev`) and click **Reload** on the extension card.

### 4. Configure settings (optional)

Open **Settings** from the Filary popup (or right-click the toolbar icon → Options):

| Setting | Default | Notes |
| ------- | ------- | ----- |
| Server base URL | `http://localhost:7002/api` | Must match the running server |
| Keyboard shortcuts | macOS: `⌘⇧Y` and `⌥⇧F` · others: `Ctrl+Shift+Y` and `Alt+Shift+F` | Both are registered; edit under `chrome://extensions/shortcuts` if needed |
| Fill mode | Empty fields only | Or overwrite all matched named fields |
| Include passwords | Off | When on, password inputs are filled; set an optional default password |
| Locale | Nigeria (English) `en-NG` | Drives names, phone, city, state; country is fixed per locale |
| Email domains | `gmail.com, yahoo.com, outlook.com` | Comma-separated; used for generated emails |

Locale and email domains are sent with each `POST /generate` request.

## Usage

1. Ensure `bun run server` is running
2. Open a page with a `<form>` (try [`demo/sample-form.html`](demo/sample-form.html) — open the file in Chrome)
3. **Click / focus any field** inside the form
4. Press **⌘⇧Y** or **⌥⇧F** on Mac (or use the Filary popup → **Fill focused form**)

Filary collects every named field in that form, asks the server for values, and fills the form.

## How fill works

```
Focus input → resolve <form> → collect name + type (+ select/radio options)
    → POST /api/generate → { values by name } → fill that form only
```

- **Form resolution:** `element.form` → `closest('form')` → latest `<form>` preceding the input in document order
- **Generation:** name + type heuristics, using your locale (default Nigeria) and email domain list
- **Radio / select:** option values are sent to the server so responses can match real choices (e.g. `male` / `female`)

## Development

```bash
# Rebuild extension on change
bun run dev

# Local generate API
bun run server
```

## Project layout

```
server/                 Local generate API (TypeServe-compatible sidecar)
  src/filary-server.ts  Express entry (POST /generate)
  src/generate.ts       Name + type → Faker values
  typeserve.config.ts   Stock TypeServe config (optional)
extension/              Chrome MV3 source → builds to extension/dist
demo/sample-form.html   Manual test form
```

## License

Filary’s own code is available for your use in this repo. TypeServe is AGPL-3.0 — see [typeserve](https://www.npmjs.com/package/typeserve) / [typeserve.com](https://www.typeserve.com/) for details.

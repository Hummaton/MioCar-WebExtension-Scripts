# `utilities.js` – Shared Utility Library for Tampermonkey Scripts

> **Location:** project root (`/utilities.js`)

---

## 1. Purpose
`utilities.js` acts as a **single shared library** for every Tampermonkey/Greasemonkey user-script in this repository.  By centralising common helpers we avoid copy-pasting code between scripts and ensure bugs are fixed in one place.

Load it with the Tampermonkey `@require` directive and all helper functions become globally available (they are attached to `window`):

```javascript
// ==UserScript==
// @name         My Awesome Script
// @require      https://example.com/path/to/utilities.js  <-- point to raw URL of utilities.js
// ...other metadata ...
// ==/UserScript==
```

Any subsequent code in your user-script can directly call the functions listed in section 3.

> ⚠️ **If the file is ever moved or renamed you MUST update every `@require` directive** in each user-script, otherwise Tampermonkey will silently keep using the old version or fail to load the helpers.

---

## 2. Loading Sequence in Tampermonkey
1. Tampermonkey downloads the script referenced by `@require` **before** executing your user-script.
2. The IIFE inside `utilities.js` runs and registers each helper under `window.*`.
3. Your script executes and can immediately use the helpers (e.g. `window.getPostHeader(...)`).

Because the functions are defined via `Object.defineProperty` with `writable: false`, later scripts cannot accidentally overwrite them.

---

## 3. Public API

| Function | Parameters | Description | Example |
|----------|------------|-------------|---------|
| `getBrowserStorageValue(key)` | `key` – string | Reads the given key from `localStorage`, parses JSON, and returns the value or `null`. | `const token = getBrowserStorageValue('oauth')?.access_token;` |
| `getPostHeader(referer)` | `referer` – string | Builds the standard headers object required for authenticated fetch/POST requests to ShareCar. | `fetch(API, { method:'POST', headers: getPostHeader(location.href) })` |
| `convertDatetimeToString(date)` | `date` – JavaScript `Date` | Converts a `Date` object to the string format `YYYY-MM-DD HH:MM:SS`. | `const ts = convertDatetimeToString(new Date());` |
| ~~`logMetricToAWS(opts)`~~ | _deprecated_ | Formerly posted structured metrics to an AWS endpoint. **Do not use**. See section 4. | – |

---

## 4. Deprecation Notice – Logging
The previous `logMetricToAWS` helper still exists in the codebase for backward compatibility, **but it is no longer used**.

We are migrating to an internal logging service exposed by our Web App. A _new_ helper (tentatively named `logToWebApp`) will be added to `utilities.js` once that endpoint is finalised.

Until that work is complete:
* **Do not** call `logMetricToAWS` in new code.
* Existing scripts should either comment out calls to `logMetricToAWS` or guard them:
  ```javascript
  if (window.logToWebApp) {
      logToWebApp({ level:'INFO', message:'something happened' });
  }
  ```
* Keep an eye on the repository release notes for the replacement helper.

---

## 5. Maintenance Checklist
1. **Adding a new helper** – Implement it inside `utilities.js` and export it via `Object.defineProperty` just like the existing ones.
2. **Moving/Renaming the file** – Search for `@require` in the `src/` directory and update every occurrence.
3. **Breaking changes** – Document them here and bump the `@version` inside `utilities.js` so Tampermonkey forces an update.

---

## 6. Troubleshooting
* Nothing happens / `getBrowserStorageValue is not defined` – Confirm the `@require` URL is correct and the network tab shows `utilities.js` downloading successfully.
* `TypeError: Cannot redefine property` – Another script attempted to overwrite a helper. Rename your local function or call the helper directly.

---

© 2025 MioCar Dev Team
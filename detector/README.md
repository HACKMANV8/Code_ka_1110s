# Camera Manipulation Detector Desktop App

Cross-platform Electron desktop utility that launches a local web API to flag known virtual camera and video manipulation software.

## Features

- macOS, Windows, and Linux compatible.
- One-button GUI to start monitoring; keeps the Express API running while the app is open.
- REST endpoints (`/health`, `/scan`, `/scan/refresh`) powered by a perceptual signature catalogue in `ps-list`.
- Configurable cache window and detection thresholds.
- Manual “Check Status” control triggers scans via IPC (no background polling) while the API remains available to other tools.
- Stop the monitoring service from the desktop app when you are done.
- Signature patterns are matched case-insensitively (extension ignored) against process names and command strings.
- Automatically blocks specified domains (reddit.com, www.reddit.com) while monitoring is active, and lifts the block on stop.
- Real-time visual state: green glow while monitoring, red alert when suspicious processes are flagged.

## Quick Start

```bash
cd detector
npm install
npm start
```

Click **Start Monitoring** to spin up the API. Use **Stop Monitoring** to shut it down when proctoring is finished. The renderer displays the active port and cache window.

> 🔐 Hosts file edits require elevated privileges. Run the app with Administrator/root rights so the Reddit block can be applied; otherwise you will see a warning in the UI and the block will be skipped.

### Environment Options

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | HTTP port exposed by the API once monitoring starts. |
| `SCAN_CACHE_MS` | `5000` | Cache lifetime (ms) before a new process scan runs. |

### CLI-Only Mode

If you need to run the API without the desktop shell:

```bash
npm run api
```

## API Overview

`GET /health` – service heartbeat with cache metadata.  
`GET /scan` – cached scan results; accepts `minimumConfidence`, `matchesRequired`, `includeCommandLine`.  
`GET /scan/refresh` – forces an immediate rescan.

Example snippet:

```json
{
  "cached": false,
  "cacheAgeMs": 18,
  "cacheWindowMs": 5000,
  "timestamp": "2025-10-31T17:31:15.409Z",
  "platform": { "type": "Darwin", "platform": "darwin", "arch": "arm64" },
  "totalProcesses": 287,
  "flaggedProcessCount": 1,
  "findings": [
    {
      "pid": 12345,
      "name": "obs64",
      "cmd": "...",
      "match": {
        "signature": "OBS Virtual Camera",
        "matchedPatterns": ["obs64"],
        "confidence": 0.85
      }
    }
  ]
}
```

## Project Structure

```
main.js                 # Electron main process
src/
  apiServer.js          # Express app factory + controls
  apiServerStandalone.js# CLI bootstrap
  preload.js            # Safe IPC bridge for renderer
  index.html            # Desktop UI
  renderer.js           # UI logic + IPC calls
  processScanner.js     # ps-list scan + signature matching
  suspiciousApps.js     # Catalogue of camera manipulation signatures
```

## Extending Detection

- Add or tune signatures in `src/suspiciousApps.js`.
- Adjust the IPC/UI to expose additional telemetry (e.g., auto-refresh health checks).
- Consume the exported `scanProcesses` helper for deeper integrations/tests.

## Network Blocking Details

When monitoring starts, the app attempts to edit the system hosts file (`/etc/hosts` on macOS/Linux, `C:\Windows\System32\drivers\etc\hosts` on Windows) and adds entries pointing `reddit.com` and `www.reddit.com` to `127.0.0.1` and `::1`. Each line is tagged with `# camera-detector-block` so we can identify our changes safely. After a successful update we flush the DNS cache (`ipconfig /flushdns` on Windows, `killall -HUP mDNSResponder` on macOS, or `systemd-resolve --flush-caches`/`resolvectl flush-caches` on Linux). Stopping monitoring—or closing the app—removes those tagged lines and flushes DNS again to restore normal access. Administrative privileges are required; if the app cannot modify the hosts file, the UI displays a warning but continues running.

## Testing Notes

Node.js 18+ is required. In CI, mock `ps-list` or provide a predictable process list before asserting API responses.

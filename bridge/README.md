# Printer Bridge (Phase 2)

Runs on a Raspberry Pi or old Android phone (via Termux) on the same WiFi as the thermal printer.

## Setup

```bash
cd bridge
npm install
PRINTER_IP=192.168.1.xxx API_SECRET=your-secret node server.js
```

Set `BRIDGE_URL` and `BRIDGE_SECRET` in the main app's Vercel environment variables to enable direct ESC/POS printing from the `/api/orders/[id]/print` route.

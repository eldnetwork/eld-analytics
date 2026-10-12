# ELD Analytics

Local dashboard for cluster disk analytics from `http://127.0.0.1:9010`.

## Run

Needs the ELD analytics API on port `9010`, then:

```bash
nvm use 22   # or any Node 20+
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api/*` to `http://127.0.0.1:9010/*`.

## Data

- `GET /health`
- `GET /analytics/disk/latest`
- `GET /analytics/disk/history?limit=48`

The main widget shows disk growth over time plus the latest Tendermint / ABCI breakdown in one place. It refreshes every 30 seconds.

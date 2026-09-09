# Solana Data Aggregator

[![CI](https://github.com/AtulJ505/data_aggregator/actions/workflows/ci.yml/badge.svg)](https://github.com/AtulJ505/data_aggregator/actions/workflows/ci.yml)

A TypeScript backend that combines Solana token data from DexScreener and GeckoTerminal, caches snapshots in Redis, and delivers updates through a REST endpoint and Socket.IO.

## What it does

- Filters DexScreener results to Solana and keeps the highest-volume pair for each token address.
- Selects up to 20 tokens by 24-hour volume and enriches their USD prices with GeckoTerminal data.
- Skips malformed records and rejects invalid prices while preserving a valid zero price.
- Uses timeouts and retries for transient upstream failures and rate limits.
- Refreshes every 10 seconds, caches results for 30 seconds, and emits `market_update` to connected clients.

The project polls external services. Updates depend on their latency, availability and rate limits; they are not instantaneous or guaranteed live market quotes.

## Quick start

Requirements: Node.js 22 or newer and Redis on port 6379.

```bash
git clone https://github.com/AtulJ505/data_aggregator.git
cd data_aggregator
npm ci
cp .env.example .env
# If Redis is not already running:
docker run --rm --name data-aggregator-redis -p 127.0.0.1:6379:6379 redis:7-alpine
```

In another terminal, run `npm run dev`. The HTTP server listens on port 3000 by default. Set `PORT` and `REDIS_URL` in `.env` to use other settings.

Open `client_test.html` in your browser for the included dashboard. It connects to the local server. Public API providers must be reachable for data to appear.

## API and events

```bash
curl http://localhost:3000/api/tokens
```

`GET /api/tokens` returns a JSON array of cached tokens, or `[]` while no snapshot is available. Each token contains its address, name, symbol, price, volume, liquidity, protocol, source and update timestamp. See [`UnifiedToken`](src/types/token.ts) for the exact fields.

Socket.IO clients receive `market_update` with the same array when a snapshot is published and receive the current cached snapshot when connecting. Socket.IO is required; this is not a raw WebSocket protocol endpoint.

## Development and validation

```bash
npm run typecheck
npm test -- --runInBand
npm run test:coverage
npm run build
npm start
```

The production build writes `dist/server.js`, which `npm start` runs. Unit tests mock upstream HTTP calls and require neither Redis nor paid API credentials. Coverage is measured by Jest; the suite does not yet exercise a live Redis server or complete Socket.IO sessions. CI checks types, tests and the production build on Node.js 22 and 24.

## Architecture

```text
DexScreener -> filter / deduplicate / rank -> GeckoTerminal price enrichment
                                          -> Redis snapshot
                                          -> REST + Socket.IO clients
```

- `src/services/`: upstream adapters and aggregation.
- `src/utils/axiosClient.ts`: shared timeout and retry policy.
- `src/server.ts`: HTTP, caching and update broadcasts.
- `tests/`: parsing, enrichment and failure regression tests.

## Current limitations

The search universe is a fixed query rather than every Solana token. Upstream failure may leave an older snapshot until its cache TTL expires. The server currently allows cross-origin reads and provides no client authentication. Review deployment configuration, dependency advisories, rate limits and service monitoring before operating it publicly.

## Contributing

Include a reproducible example when reporting a bug. For code changes, add a focused regression test, run the validation commands above, and open a pull request explaining the behavior before and after the change.

## License

ISC, matching the existing package metadata. See [LICENSE](LICENSE).

# Real Time Data Aggregation Service

This is a backend service that aggregates real-time price and volume data for popular Solana meme coins. It fetches data from DexScreener and GeckoTerminal, merges it to remove duplicates, and broadcasts updates to clients via WebSockets.

I designed this to be "zero-latency" for the client—all the heavy lifting (filtering, sorting, caching) happens on the server.

## Key Features of this Backend service

* **Real-Time Updates:** Uses WebSockets (Socket.io) to push data instantly. No manual refreshing needed.
* **Data Aggregation:** Merges data from multiple sources to handle duplicates (e.g., merging "Wrapped SOL" entries).
* **Resilience:** Implements exponential backoff retries for API calls to handle rate limits.
* **Client-Side Filtering:** The dashboard supports sorting by Price/Volume and filtering by time period (1h, 24h, 7d) instantly.
* **100% Test Coverage:** Includes 11 Unit Tests covering edge cases, network failures, and data validation.

## Tech Stack Used

* **Runtime:** Node.js & TypeScript
* **API Framework:** Fastify
* **Real-Time:** Socket.io
* **Caching:** Redis
* **Testing:** Jest

### Prerequisites
* Node.js
* Redis (Running locally or via Docker)

##  How to Run

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Redis (if using Docker)**
    docker run --name my-redis -p 6379:6379 -d redis


3.  **Start the Server**
    ```bash
    npm run dev
    ```
    You should see: `Server running on port 3000`

4.  **Open the Dashboard**
    Open `client_test.html` in your browser.
    * You will see a live list of ~20 top tokens.
    * Try the "Sort By Volume" or "Next Page" buttons to see the client interaction.

## Testing

I wrote a comprehensive test suite to ensure the aggregator handles API errors and malformed data correctly.

To run the tests:
```bash
npm run test
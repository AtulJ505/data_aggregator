import { client } from '../src/utils/axiosClient';
import { fetchDexScreenerData } from '../src/services/dexScreener';
import { fetchGeckoTerminalPrices } from '../src/services/geckoTerminal';
import { runAggregation } from '../src/services/aggregator';

jest.mock('../src/utils/axiosClient', () => ({ client: { get: jest.fn() } }));
const get = client.get as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

test('one malformed pair does not discard valid tokens; highest-volume pair wins', async () => {
  get.mockResolvedValueOnce({ data: { pairs: [
    null, { chainId: 'solana' },
    { chainId: 'solana', baseToken: { address: 'A' } },
    { chainId: 'solana', baseToken: { address: 'B' }, volume: { h24: 12 } },
    { chainId: 'solana', baseToken: { address: 'A' }, volume: { h24: 20 }, priceUsd: 'bad', priceChange: { h1: -3 } },
  ] } });
  const tokens = await fetchDexScreenerData();
  expect(tokens.map(t => t.address)).toEqual(['A', 'B']);
  expect(tokens[0]).toMatchObject({ price: 0, volume24h: 20, priceChange1h: -3, protocol: 'Unknown' });
  expect(JSON.stringify(tokens)).not.toContain('null');
});

test.each([null, {}, 'invalid'])('handles malformed pairs container %p', async pairs => {
  get.mockResolvedValueOnce({ data: { pairs } });
  expect(await fetchDexScreenerData()).toEqual([]);
});

test('keeps zero prices and rejects malformed or negative upstream prices', async () => {
  get.mockResolvedValueOnce({ data: { data: { attributes: { token_prices: {
    zero: '0', valid: '1.25', negative: '-2', malformed: '12usd', empty: '', infinity: 'Infinity', nil: null,
  } } } } });
  expect(await fetchGeckoTerminalPrices(['zero', 'valid'])).toEqual({ zero: 0, valid: 1.25 });
});

test('zero-price enrichment replaces stale nonzero data', async () => {
  get.mockResolvedValueOnce({ data: { pairs: [{ chainId: 'solana', baseToken: { address: 'A' }, priceUsd: '10' }] } });
  get.mockResolvedValueOnce({ data: { data: { attributes: { token_prices: { A: '0' } } } } });
  expect((await runAggregation())[0]).toMatchObject({ price: 0, source: 'aggregated' });
});

test('does not call the enrichment API without token addresses', async () => {
  expect(await fetchGeckoTerminalPrices([])).toEqual({});
  expect(get).not.toHaveBeenCalled();
});

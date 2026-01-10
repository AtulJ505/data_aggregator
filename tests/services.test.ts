import axios from 'axios';
import { fetchDexScreenerData } from '../src/services/dexScreener';
import { fetchGeckoTerminalPrices } from '../src/services/geckoTerminal';


jest.mock('axios-retry', () => jest.fn());


jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  };
  return {
    create: jest.fn(() => mockAxiosInstance),
    ...mockAxiosInstance 
  };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Individual Services (Worker Tests)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedAxios.create as jest.Mock).mockReturnValue(mockedAxios);
  });


  describe('DexScreener Fetcher', () => {
    
    it('1. should parse and format API data correctly', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          pairs: [{
            chainId: 'solana',
            baseToken: { name: 'Test', symbol: 'TEST', address: '0x1' },
            priceNative: '0.05',
            priceUsd: '1.05',
            volume: { h24: 1000 },
            liquidity: { quote: 500 },
            dexId: 'raydium', 
            txns: { h24: { buys: 10, sells: 5 } } 
          }]
        }
      });

      const result = await fetchDexScreenerData();
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('TEST');
      expect(result[0].txCount24h).toBe(15);
    });

    it('2. should filter out non-Solana tokens', async () => {
      
      mockedAxios.get.mockResolvedValue({
        data: {
          pairs: [
            { 
              chainId: 'solana', 
              baseToken: { name: 'S', symbol: 'S', address: 'sol1' }, 
              dexId: 'raydium', 
              volume: { h24: 100 } 
            },
            { 
              chainId: 'ethereum', 
              baseToken: { name: 'E', symbol: 'E', address: 'eth1' }, 
              dexId: 'uniswap', 
              volume: { h24: 100 } 
            },
            { 
              chainId: 'bsc', 
              baseToken: { name: 'B', symbol: 'B', address: 'bsc1' }, 
              dexId: 'pancakeswap', 
              volume: { h24: 100 } 
            }
          ]
        }
      });

      const result = await fetchDexScreenerData();
      expect(result).toHaveLength(1);
      expect(result[0].address).toBe('sol1');
    });

    it('3. should deduplicate and keep highest volume pair', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          pairs: [
            { 
              chainId: 'solana', 
              baseToken: { name: 'A', symbol: 'A', address: 'tokenA' }, 
              dexId: 'raydium',
              volume: { h24: 500 } 
            },
            { 
              chainId: 'solana', 
              baseToken: { name: 'A', symbol: 'A', address: 'tokenA' }, 
              dexId: 'orca',
              volume: { h24: 5000 } 
            }
          ]
        }
      });

      const result = await fetchDexScreenerData();
      expect(result).toHaveLength(1);
      expect(result[0].volume24h).toBe(5000); 
    });

    it('4. should handle missing optional fields safely', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          pairs: [{
            chainId: 'solana',
            baseToken: { name: 'Empty', symbol: 'EMP', address: '0x99' },
            dexId: 'raydium',
            volume: { h24: 0 }
          }]
        }
      });

      const result = await fetchDexScreenerData();
      expect(result).toHaveLength(1);
      expect(result[0].txCount24h).toBe(0);
      expect(result[0].liquiditySol).toBe(0);
    });

    it('5. should return empty list on Network Error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      const result = await fetchDexScreenerData();
      expect(result).toEqual([]);
    });
  });


  describe('GeckoTerminal Fetcher', () => {
    
    it('6. should return a price map for valid tokens', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            attributes: {
              token_prices: { '0x123': '50.5' }
            }
          }
        }
      });

      const prices = await fetchGeckoTerminalPrices(['0x123']);
      expect(prices['0x123']).toBe(50.5); 
    });

    it('7. should handle malformed/empty API response', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { data: { attributes: {} } } 
      });

      const prices = await fetchGeckoTerminalPrices(['0x123']);
      expect(prices).toEqual({});
    });

    it('8. should return empty object on Network Error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Down'));
      const prices = await fetchGeckoTerminalPrices(['0xABC']);
      expect(prices).toEqual({});
    });
  });
});
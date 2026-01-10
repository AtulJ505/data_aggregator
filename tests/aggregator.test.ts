import { runAggregation } from '../src/services/aggregator';
import { fetchDexScreenerData } from '../src/services/dexScreener';
import { fetchGeckoTerminalPrices } from '../src/services/geckoTerminal';

jest.mock('../src/services/dexScreener');
jest.mock('../src/services/geckoTerminal');

describe('Aggregator Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty list if DexScreener fails', async () => {
    (fetchDexScreenerData as jest.Mock).mockResolvedValue([]);
    
    const result = await runAggregation();
    expect(result).toEqual([]);
  });

  it('should merge data correctly when GeckoTerminal has prices', async () => {
    
    (fetchDexScreenerData as jest.Mock).mockResolvedValue([
      { 
        name: 'TestCoin', 
        address: '0x123', 
        price: 10, 
        source: 'dexscreener' 
      }
    ]);

    
    (fetchGeckoTerminalPrices as jest.Mock).mockResolvedValue({
      '0x123': 20.5 
    });

    
    const result = await runAggregation();

    
    expect(result[0].price).toBe(20.5); 
    expect(result[0].source).toBe('aggregated');
  });

  it('should keep DexScreener price if GeckoTerminal misses', async () => {
    (fetchDexScreenerData as jest.Mock).mockResolvedValue([
      { 
        name: 'TestCoin', 
        address: '0xABC', 
        price: 5, 
        source: 'dexscreener' 
      }
    ]);

    (fetchGeckoTerminalPrices as jest.Mock).mockResolvedValue({});

    const result = await runAggregation();

    expect(result[0].price).toBe(5);
    expect(result[0].source).toBe('dexscreener');
  });
});
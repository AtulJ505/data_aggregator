
import { fetchDexScreenerData } from './dexScreener';
import { fetchGeckoTerminalPrices } from './geckoTerminal';
import { UnifiedToken } from '../types/token';

export const runAggregation = async (): Promise<UnifiedToken[]> => {
  try {
    console.log(' Syncing data sources...');
    
    
    const dexTokens = await fetchDexScreenerData();
    if (dexTokens.length === 0) return [];

    
    const addresses = dexTokens.map(t => t.address);
    const geckoPrices = await fetchGeckoTerminalPrices(addresses);

    
    const mergedData = dexTokens.map(t => {
      const freshPrice = geckoPrices[t.address];
      
      
      if (typeof freshPrice === 'number' && Number.isFinite(freshPrice) && freshPrice >= 0) {
        return { 
          ...t, 
          price: freshPrice, 
          source: 'aggregated' 
        };
      }
      
      return t;
    });

    console.log(`Aggregated: ${mergedData.length} tokens.`);
    return mergedData;

  } catch (error) {
    console.error('Aggregation failed:', error);
    return [];
  }
};

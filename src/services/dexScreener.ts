
import axios from 'axios';
import { UnifiedToken } from '../types/token';


const DEX_API = 'https://api.dexscreener.com/latest/dex/search?q=bonk%20wif%20popcat%20pengu%20mew%20bome%20slerf%20wen%20myro%20duko%20chat%20solama%20cwif%20boden%20harambe'; 

export const fetchDexScreenerData = async (): Promise<UnifiedToken[]> => {
  try {
    const response = await axios.get(DEX_API);
    const pairs = response.data.pairs || [];
    const uniqueTokens = new Map<string, any>();

    pairs.forEach((pair: any) => {
      
      if (pair.chainId !== 'solana') return;
      
      const address = pair.baseToken.address;

      
      if (!uniqueTokens.has(address) || pair.volume.h24 > uniqueTokens.get(address).volume.h24) {
        uniqueTokens.set(address, pair);
      }
    });

    
    return Array.from(uniqueTokens.values())
      .slice(0, 20)
      .map((pair: any) => {
        
        
        const txns = pair.txns?.h24 || { buys: 0, sells: 0 };
        const totalTx = txns.buys + txns.sells;

        
        let protocol = pair.dexId.charAt(0).toUpperCase() + pair.dexId.slice(1);
        if (pair.labels && pair.labels.includes('CLMM')) {
            protocol += " CLMM";
        }

        return {
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          address: pair.baseToken.address,
          
          price: parseFloat(pair.priceUsd || '0'),
          marketCap: pair.fdv || 0,
          volume24h: pair.volume?.h24 || 0,
          
          
          priceSol: parseFloat(pair.priceNative || '0'), 
          liquiditySol: pair.liquidity?.quote || 0,
          txCount24h: totalTx,
          priceChange1h: pair.priceChange?.h1 || 0,
          protocol: protocol,
          
          source: 'dexscreener',
          lastUpdated: Date.now(),
        };
      });

  } catch (error) {
    console.error('Error fetching DexScreener:', error);
    return [];
  }
};
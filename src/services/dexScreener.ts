import { client } from '../utils/axiosClient';
import { UnifiedToken } from '../types/token';

const DEX_API = 'https://api.dexscreener.com/latest/dex/search?q=bonk%20wif%20popcat%20pengu%20mew%20bome%20slerf%20wen%20myro%20duko%20chat%20solama%20cwif%20boden%20harambe';

function finiteNumber(value: unknown, allowNegative = false): number {
  if (typeof value !== 'number' && typeof value !== 'string') return 0;
  const number = Number(value);
  return Number.isFinite(number) && (allowNegative || number >= 0) ? number : 0;
}

export const fetchDexScreenerData = async (): Promise<UnifiedToken[]> => {
  try {
    const response = await client.get(DEX_API);
    const pairs = response.data?.pairs;
    if (!Array.isArray(pairs)) return [];
    const uniqueTokens = new Map<string, UnifiedToken>();

    for (const pair of pairs) {
      if (!pair || pair.chainId !== 'solana') continue;
      const address = pair.baseToken?.address;
      if (typeof address !== 'string' || !address.trim()) continue;
      const volume24h = finiteNumber(pair.volume?.h24);
      const existing = uniqueTokens.get(address);
      if (existing && existing.volume24h >= volume24h) continue;
      const dexId = typeof pair.dexId === 'string' && pair.dexId ? pair.dexId : 'unknown';
      let protocol = dexId.charAt(0).toUpperCase() + dexId.slice(1);
      if (Array.isArray(pair.labels) && pair.labels.includes('CLMM')) protocol += ' CLMM';
      uniqueTokens.set(address, {
        name: typeof pair.baseToken.name === 'string' ? pair.baseToken.name : address,
        symbol: typeof pair.baseToken.symbol === 'string' ? pair.baseToken.symbol : '',
        address,
        price: finiteNumber(pair.priceUsd),
        marketCap: finiteNumber(pair.fdv),
        volume24h,
        priceSol: finiteNumber(pair.priceNative),
        liquiditySol: finiteNumber(pair.liquidity?.quote),
        txCount24h: finiteNumber(pair.txns?.h24?.buys) + finiteNumber(pair.txns?.h24?.sells),
        priceChange1h: finiteNumber(pair.priceChange?.h1, true),
        protocol,
        source: 'dexscreener',
        lastUpdated: Date.now(),
      });
    }
    return [...uniqueTokens.values()].sort((a, b) => b.volume24h - a.volume24h).slice(0, 20);
  } catch (error) {
    console.error('Error fetching DexScreener:', error);
    return [];
  }
};

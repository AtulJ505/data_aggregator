import { client } from '../utils/axiosClient';

const BASE_URL = 'https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price';

export const fetchGeckoTerminalPrices = async (addresses: string[]): Promise<Record<string, number>> => {
  if (addresses.length === 0) return {};

  try {
    const addressStr = addresses.join(',');
    const response = await client.get(`${BASE_URL}/${addressStr}`);
    
    const rawPrices = response.data?.data?.attributes?.token_prices || {};
    const cleanPrices: Record<string, number> = {};

    for (const [addr, priceStr] of Object.entries(rawPrices)) {
      
      if (typeof priceStr !== 'string' && typeof priceStr !== 'number') continue;
      if (typeof priceStr === 'string' && priceStr.trim() === '') continue;
      const price = Number(priceStr);
      if (Number.isFinite(price) && price >= 0) cleanPrices[addr] = price;
    }

    return cleanPrices;
  } catch (error) {
    console.error(' Error fetching GeckoTerminal:', error);
    return {};
  }
};

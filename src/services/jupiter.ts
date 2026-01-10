import {client} from '../utils/axiosClient';


const JUP_PRICE_API = 'https://price.jup.ag/v6/price?ids=';

export const fetchJupiterPrices = async (tokenAddresses: string[]) => {
  try {
    if (tokenAddresses.length === 0) return {};

  
    const query = tokenAddresses.join(',');
    const url = `${JUP_PRICE_API}${query}`;

    const response = await client.get(url);
    
    
    return response.data.data || {}; 

  } catch (error) {
    console.error(' Error fetching Jupiter Prices:', error);
    return {};
  }
};
export interface UnifiedToken {
  name: string;
  symbol: string;
  address: string;
  

  price: number;          
  marketCap: number;      
  volume24h: number;
  
  
  priceSol: number;       
  liquiditySol: number;   
  txCount24h: number;     
  priceChange1h: number;  
  protocol: string;       
  
  
  source: string;
  lastUpdated: number;
}
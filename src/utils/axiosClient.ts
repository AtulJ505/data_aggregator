import axios from 'axios';
import axiosRetry from 'axios-retry';
export const client = axios.create({
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  }
});


axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           error.response?.status === 429;
  }
});
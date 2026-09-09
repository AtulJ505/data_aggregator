import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import 'dotenv/config';
import Redis from 'ioredis';
import { runAggregation } from './services/aggregator';

const fastify = Fastify({ logger: true });
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');


fastify.register(cors, { 
  origin: "*" 
});

const io = new Server(fastify.server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});


fastify.get('/api/tokens', async (request, reply) => {
  const cached = await redis.get('aggregated_tokens');
  if (cached) return JSON.parse(cached);
  return [];
});


io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  
  redis.get('aggregated_tokens').then((data) => {
    if (data) socket.emit('market_update', JSON.parse(data));
  });
});

setInterval(async () => {
  try {
    const tokens = await runAggregation();
    
    if (tokens.length > 0) {
      
      await redis.set('aggregated_tokens', JSON.stringify(tokens), 'EX', 30);
      
      
      io.emit('market_update', tokens);
      console.log(` Broadcasted ${tokens.length} tokens to clients.`);
    }
  } catch (err) {
    console.error("Aggregation error:", err);
  }
}, 10000);


const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT || 3000), host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${process.env.PORT || 3000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
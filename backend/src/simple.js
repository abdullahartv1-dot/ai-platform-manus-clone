import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import routes from './routes/index.js';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
  sign: {
    expiresIn: '7d'
  }
});

// Health check
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };
});

// Simple test route
fastify.get('/test', async (request, reply) => {
  return {
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  };
});

// Register routes
for (const route of routes) {
  await fastify.register(route.handler, { prefix: route.path });
}

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });

    console.log('🚀 Server is running!');
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`✅ Test: http://localhost:${port}/test`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

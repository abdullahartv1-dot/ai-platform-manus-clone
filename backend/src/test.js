import Fastify from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Health check
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
});

// Simple test route
fastify.get('/test', async (request, reply) => {
  return {
    message: 'Backend is working!'
  };
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });

    console.log('🚀 Backend test server is running!');
    console.log(`📊 Health: http://localhost:${port}/health`);
    console.log(`✅ Test: http://localhost:${port}/test`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

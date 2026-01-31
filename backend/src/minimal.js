// Test all routes without auth/rate limiting
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

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
    message: 'Test route working!',
    timestamp: new Date().toISOString()
  };
});

// Check if we can reach database
fastify.get('/db-check', async (request, reply) => {
  try {
    const userCount = await prisma.user.count();
    return {
      status: 'Database connection OK',
      userCount
    };
  } catch (error) {
    return reply.status(500).send({
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Test prisma directly
fastify.get('/prisma-test', async (request, reply) => {
  try {
    const user = await prisma.user.findFirst();
    return {
      status: 'Prisma OK',
      firstUser: user ? { id: user.id, email: user.email } : null
    };
  } catch (error) {
    return reply.status(500).send({
      error: 'Prisma test failed',
      details: error.message
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });

    console.log('🚀 Test server is running!');
    console.log(`📊 Health: http://localhost:${port}/health`);
    console.log(`✅ Test: http://localhost:${port}/test`);
    console.log(`💾 DB Check: http://localhost:${port}/db-check`);
    console.log(`🔍 Prisma Test: http://localhost:${port}/prisma-test`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

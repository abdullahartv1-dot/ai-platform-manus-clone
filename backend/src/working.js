import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';

import { PrismaClient } from '@prisma/client';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Prisma Client
const prisma = new PrismaClient();

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

// Test route
fastify.get('/test', async () => {
  return {
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  };
});

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  if (error.code === 'P2002') {
    return reply.status(400).send({ error: 'Record already exists' });
  }

  if (error.code === 'P2025') {
    return reply.status(404).send({ error: 'Record not found' });
  }

  return reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal server error'
  });
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });

    console.log('🚀 Backend is running!');
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`✅ Test route: http://localhost:${port}/test`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nShutting down gracefully...');

  try {
    await prisma.$disconnect();
    await fastify.close();
    console.log('Server closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

start();

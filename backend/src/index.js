import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import supportRoutes from './routes/support.js';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_here'
});

// Register Swagger
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'AI Platform API',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ]
  }
});

await fastify.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  }
});

// Health check
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
});

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(usersRoutes, { prefix: '/api/users' });
await fastify.register(adminRoutes, { prefix: '/api/admin' });
await fastify.register(supportRoutes, { prefix: '/api/support' });

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });

    console.log('🚀 Server is running!');
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📚 API Docs: http://localhost:${port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

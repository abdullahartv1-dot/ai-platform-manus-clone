// Fixed Controllers - Direct fastify usage
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { createRateLimit } from '../lib/rateLimit.js';

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

export default async function authRoutes(fastify, options) {
  // Register
  fastify.post('/register', {
    onRequest: [authRateLimit]
  }, async (request, reply) => {
    try {
      const { email, password, name } = request.body;

      if (!email || !email.includes('@')) {
        return reply.status(400).send({ error: 'Invalid email' });
      }

      if (!password || password.length < 8) {
        return reply.status(400).send({ error: 'Password must be at least 8 characters' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.status(400).send({ error: 'User already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { email, passwordHash, name }
      });

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus
        },
        token
      };
    } catch (error) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Login
  fastify.post('/login', {
    onRequest: [authRateLimit]
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);

      if (!validPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      });

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus
        },
        token
      };
    } catch (error) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          subscriptionStatus: true,
          subscriptionStartedAt: true,
          subscriptionExpiresAt: true,
          serverId: true,
          serverIp: true,
          serverStatus: true,
          defaultModel: true,
          maxUsageHours: true,
          maxProjects: true,
          customModels: true,
          lastActiveAt: true,
          createdAt: true
        }
      });

      return user;
    } catch (error) {
      return reply.status(404).send({ error: 'User not found' });
    }
  });

  // Update profile
  fastify.put('/profile', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { name, defaultModel } = request.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (defaultModel) updateData.defaultModel = defaultModel;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          defaultModel: user.defaultModel
        }
      };
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Update custom models
  fastify.put('/models', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { provider, apiKey, model } = request.body;

      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { customModels: true }
      });

      const customModels = userRecord.customModels || {};

      if (provider && apiKey && model) {
        customModels[provider] = { apiKey, model };
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          customModels,
          defaultModel: model
        }
      });

      return {
        success: true,
        provider,
        model
      };
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });
}

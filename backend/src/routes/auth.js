import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { authValidators } from '../lib/validators.js';
import { createRateLimit } from '../lib/rateLimit.js';

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per window
});

export default async function authRoutes(fastify, options) {
  // Register
  fastify.post('/register', {
    onRequest: [authRateLimit]
  }, async (request, reply) => {
    try {
      const { email, password, name } = request.body;

      // Validate input
      authValidators.register({ email, password, name });

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.status(400).send({
          error: 'User already exists'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name
        }
      });

      // Generate token
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
      if (error.message.includes('is required') || error.message.includes('Invalid')) {
        return reply.status(400).send({
          error: error.message
        });
      }
      throw error;
    }
  });

  // Login
  fastify.post('/login', {
    onRequest: [authRateLimit]
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;

      // Validate input
      authValidators.login({ email, password });

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return reply.status(401).send({
          error: 'Invalid credentials'
        });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.passwordHash);

      if (!validPassword) {
        return reply.status(401).send({
          error: 'Invalid credentials'
        });
      }

      // Update last active
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      });

      // Generate token
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
          subscriptionStatus: user.subscriptionStatus,
          serverId: user.serverId,
          serverIp: user.serverIp,
          serverStatus: user.serverStatus
        },
        token
      };
    } catch (error) {
      if (error.message.includes('is required') || error.message.includes('Invalid')) {
        return reply.status(400).send({
          error: error.message
        });
      }
      throw error;
    }
  });

  // Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
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
  });

  // Update profile
  fastify.put('/profile', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
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
  });

  // Update custom models
  fastify.put('/models', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { provider, apiKey, model } = request.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { customModels: true }
    });

    const customModels = user.customModels || {};

    customModels[provider] = {
      apiKey,
      model
    };

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
  });
}

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function authRoutes(fastify, options) {
  // Register
  fastify.post('/register', async (request, reply) => {
    const { email, password, name } = request.body;

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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus
      },
      token
    };
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

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

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(defaultModel && { defaultModel })
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      defaultModel: user.defaultModel
    };
  });

  // Update custom models
  fastify.put('/models', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { provider, apiKey, model } = request.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user.customModels) {
      user.customModels = {};
    }

    user.customModels[provider] = {
      apiKey,
      model
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        customModels: user.customModels,
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

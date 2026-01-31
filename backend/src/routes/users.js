import prisma from '../lib/prisma.js';
import { createRateLimit } from '../lib/rateLimit.js';

const usersRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});

export default async function usersRoutes(fastify, options) {
  // Get user dashboard data
  fastify.get('/dashboard', {
    onRequest: [fastify.authenticate, usersRateLimit]
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
        lastActiveAt: true
      }
    });

    // Get recent backups
    const backups = await prisma.backup.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get recent invoices
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get active tickets
    const tickets = await prisma.supportTicket.findMany({
      where: {
        userId,
        status: {
          not: 'closed'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return {
      user,
      backups,
      invoices,
      tickets
    };
  });

  // Get user's backups (with pagination)
  fastify.get('/backups', {
    onRequest: [fastify.authenticate, usersRateLimit]
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { page = 1, limit = 20 } = request.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [backups, total] = await Promise.all([
      prisma.backup.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.backup.count({ where: { userId } })
    ]);

    return {
      backups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  });

  // Get user's invoices (with pagination)
  fastify.get('/invoices', {
    onRequest: [fastify.authenticate, usersRateLimit]
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { page = 1, limit = 20 } = request.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.invoice.count({ where: { userId } })
    ]);

    return {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  });

  // Get subscription plans
  fastify.get('/plans', async (request, reply) => {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { status: 'active' },
      orderBy: { price: 'asc' }
    });

    return plans;
  });
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function usersRoutes(fastify, options) {
  // Get user dashboard data
  fastify.get('/dashboard', {
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

  // Get user's backups
  fastify.get('/backups', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.userId;

    const backups = await prisma.backup.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return backups;
  });

  // Get user's invoices
  fastify.get('/invoices', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.userId;

    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return invoices;
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

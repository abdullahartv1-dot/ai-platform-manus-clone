import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function adminRoutes(fastify, options) {
  // Verify admin access
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Get admin stats
  fastify.get('/stats', async (request, reply) => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.user.count();

    // Active users (last 7 days)
    const activeUsers = await prisma.user.count({
      where: {
        lastActiveAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Monthly revenue (last 30 days)
    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'paid',
        createdAt: {
          gte: monthAgo
        }
      }
    });

    const mrr = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const arr = mrr * 12;

    // Active servers
    const activeServers = await prisma.user.count({
      where: {
        serverStatus: 'running',
        subscriptionStatus: 'active'
      }
    });

    const stoppedServers = await prisma.user.count({
      where: {
        serverStatus: 'stopped',
        subscriptionStatus: 'active'
      }
    });

    // Server costs (estimate)
    const serverCost = activeServers * 10.5 + stoppedServers * 5.25; // Hetzner pricing

    return {
      totalUsers,
      activeUsers,
      mrr,
      arr,
      activeServers,
      stoppedServers,
      serverCost
    };
  });

  // Get all users
  fastify.get('/users', async (request, reply) => {
    const { search, status, plan } = request.query;

    const where = {};

    if (status && status !== 'all') {
      where.subscriptionStatus = status;
    }

    if (plan && plan !== 'all') {
      where.plan = plan;
    }

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        serverId: true,
        serverIp: true,
        serverStatus: true,
        subscriptionExpiresAt: true,
        lastActiveAt: true,
        createdAt: true
      }
    });

    return users;
  });

  // Get subscription plans
  fastify.get('/subscriptions', async (request, reply) => {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    });

    return plans;
  });

  // Create subscription plan
  fastify.post('/subscriptions', async (request, reply) => {
    const data = request.body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        price: data.price,
        planType: data.planType || 'monthly',
        serverType: data.serverType,
        serverSpecs: {
          cpu: data.cpu,
          ram: data.ram,
          storage: data.storage,
          bandwidth: data.bandwidth
        },
        maxUsageHours: data.maxUsageHours,
        maxProjects: data.maxProjects,
        backupRetentionDays: data.backupRetentionDays,
        features: data.features || [],
        status: data.status || 'active',
        stripePriceId: data.stripePriceId
      }
    });

    return plan;
  });

  // Update subscription plan
  fastify.put('/subscriptions/:id', async (request, reply) => {
    const { id } = request.params;
    const data = request.body;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: data.name,
        price: data.price,
        planType: data.planType,
        serverType: data.serverType,
        serverSpecs: {
          cpu: data.cpu,
          ram: data.ram,
          storage: data.storage,
          bandwidth: data.bandwidth
        },
        maxUsageHours: data.maxUsageHours,
        maxProjects: data.maxProjects,
        backupRetentionDays: data.backupRetentionDays,
        features: data.features,
        status: data.status,
        stripePriceId: data.stripePriceId
      }
    });

    return plan;
  });

  // Delete subscription plan
  fastify.delete('/subscriptions/:id', async (request, reply) => {
    const { id } = request.params;

    // Check if any users are subscribed
    const users = await prisma.user.count({
      where: { plan: id }
    });

    if (users > 0) {
      return reply.status(400).send({
        error: 'Cannot delete plan with active subscribers'
      });
    }

    await prisma.subscriptionPlan.delete({
      where: { id }
    });

    return { success: true };
  });

  // Suspend user
  fastify.post('/users/:id/suspend', async (request, reply) => {
    const { id } = request.params;

    await prisma.user.update({
      where: { id },
      data: {
        subscriptionStatus: 'suspended',
        serverStatus: 'stopped'
      }
    });

    return { success: true };
  });

  // Activate user
  fastify.post('/users/:id/activate', async (request, reply) => {
    const { id } = request.params;

    await prisma.user.update({
      where: { id },
      data: {
        subscriptionStatus: 'active',
        serverStatus: 'running'
      }
    });

    return { success: true };
  });

  // Delete user
  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params;

    await prisma.user.delete({
      where: { id }
    });

    return { success: true };
  });
}

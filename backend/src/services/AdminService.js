import prisma from '../lib/prisma.js';

// Admin Service - Business Logic Layer
export class AdminService {
  // Get admin statistics
  async getStats() {
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

    const mrr = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
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
      mrr: Number(mrr.toFixed(2)),
      arr: Number(arr.toFixed(2)),
      activeServers,
      stoppedServers,
      serverCost: Number(serverCost.toFixed(2))
    };
  }

  // Get all users (with pagination)
  async getAllUsers(filters) {
    const { search, status, plan, page = 1, limit = 50 } = filters;

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // Suspend user
  async suspendUser(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'suspended',
        serverStatus: 'stopped'
      }
    });

    return { success: true };
  }

  // Activate user
  async activateUser(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'active',
        serverStatus: 'running'
      }
    });

    return { success: true };
  }

  // Delete user
  async deleteUser(userId) {
    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true };
  }
}

export default new AdminService();

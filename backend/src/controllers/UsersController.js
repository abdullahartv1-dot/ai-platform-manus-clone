import { createRateLimit } from '../lib/rateLimit.js';
import { verifyAdmin } from '../lib/adminAuth.js';
import prisma from '../lib/prisma.js';
import UserService from '../services/UserService.js';
import SubscriptionService from '../services/SubscriptionService.js';

const usersRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});

export default async function usersRoutes(fastify, options) {
  // Get user dashboard data
  fastify.get('/dashboard', {
    onRequest: [fastify.authenticate, usersRateLimit]
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const data = await UserService.getDashboardData(userId);

      return reply.send(data);
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Get user's backups (with pagination)
  fastify.get('/backups', {
    onRequest: [fastify.authenticate, usersRateLimit]
  }, async (request, reply) => {
    try {
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

      return reply.send({
        backups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Get user's invoices (with pagination)
  fastify.get('/invoices', {
    onRequest: [fastify.authenticate, usersRateLimit]
  }, async (request, reply) => {
    try {
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

      return reply.send({
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Get subscription plans
  fastify.get('/plans', async (request, reply) => {
    try {
      const plans = await SubscriptionService.getActivePlans();

      return reply.send(plans);
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });
}

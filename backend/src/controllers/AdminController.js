import { createRateLimit } from '../lib/rateLimit.js';
import { verifyAdmin } from '../lib/adminAuth.js';
import prisma from '../lib/prisma.js';
import AdminService from '../services/AdminService.js';
import SubscriptionService from '../services/SubscriptionService.js';

const adminRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});

export default async function adminRoutes(fastify, options) {
  // Verify admin access for ALL routes
  fastify.addHook('onRequest', verifyAdmin);

  // Get admin stats
  fastify.get('/stats', {
    onRequest: [adminRateLimit]
  }, async (request, reply) => {
    try {
      const stats = await AdminService.getStats();

      return reply.send(stats);
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Get all users (with pagination)
  fastify.get('/users', {
    onRequest: [adminRateLimit]
  }, async (request, reply) => {
    try {
      const users = await AdminService.getAllUsers(request.query);

      return reply.send(users);
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Get subscription plans
  fastify.get('/subscriptions', async (request, reply) => {
    try {
      const plans = await SubscriptionService.getAllPlans();

      return reply.send(plans);
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Create subscription plan
  fastify.post('/subscriptions', async (request, reply) => {
    try {
      const plan = await SubscriptionService.createPlan(request.body);

      return reply.status(201).send({
        success: true,
        plan
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return reply.status(400).send({
          error: error.message
        });
      }
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Update subscription plan
  fastify.put('/subscriptions/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const plan = await SubscriptionService.updatePlan(id, request.body);

      return reply.send({
        success: true,
        plan
      });
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Delete subscription plan
  fastify.delete('/subscriptions/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await SubscriptionService.deletePlan(id);

      return reply.send(result);
    } catch (error) {
      if (error.message.includes('Cannot delete')) {
        return reply.status(400).send({
          error: error.message
        });
      }
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Suspend user
  fastify.post('/users/:id/suspend', async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await AdminService.suspendUser(id);

      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Activate user
  fastify.post('/users/:id/activate', async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await AdminService.activateUser(id);

      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Delete user
  fastify.delete('/users/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await AdminService.deleteUser(id);

      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });
}

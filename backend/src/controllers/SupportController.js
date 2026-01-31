import { createRateLimit } from '../lib/rateLimit.js';
import { verifyAdmin } from '../lib/adminAuth.js';
import SupportService from '../services/SupportService.js';

const supportRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // 20 requests per window
});

export default async function supportRoutes(fastify, options) {
  // Get user's tickets
  fastify.get('/tickets', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const tickets = await SupportService.getUserTickets(userId);

      return reply.send(tickets);
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Create ticket
  fastify.post('/tickets', {
    onRequest: [fastify.authenticate, supportRateLimit]
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const ticket = await SupportService.createTicket(userId, request.body);

      return reply.status(201).send({
        success: true,
        ticket
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

  // Get ticket details
  fastify.get('/tickets/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;
      const ticket = await SupportService.getTicketById(userId, id);

      return reply.send(ticket);
    } catch (error) {
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          error: error.message
        });
      }
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Add message to ticket
  fastify.post('/tickets/:id/messages', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.userId;
      const { message } = request.body;
      const ticketMessage = await SupportService.addMessageToTicket(userId, id, message);

      return reply.status(201).send({
        success: true,
        message: ticketMessage
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          error: error.message
        });
      }
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Admin: Get all tickets (with pagination)
  fastify.get('/admin/tickets', {
    onRequest: [verifyAdmin]
  }, async (request, reply) => {
    try {
      const tickets = await SupportService.getAllTickets(request.query);

      return reply.send(tickets);
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Admin: Update ticket status
  fastify.put('/admin/tickets/:id', {
    onRequest: [verifyAdmin]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const ticket = await SupportService.updateTicket(id, request.body);

      return reply.send({
        success: true,
        ticket
      });
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });

  // Admin: Add message to ticket
  fastify.post('/admin/tickets/:id/messages', {
    onRequest: [verifyAdmin]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { message } = request.body;
      const adminId = request.admin.id;
      const ticketMessage = await SupportService.addAdminMessage(id, adminId, message);

      return reply.status(201).send({
        success: true,
        message: ticketMessage
      });
    } catch (error) {
      return reply.status(500).send({
        error: error.message
      });
    }
  });
}

import prisma from '../lib/prisma.js';
import { ticketValidators } from '../lib/validators.js';
import { createRateLimit } from '../lib/rateLimit.js';
import { verifyAdmin } from '../lib/adminAuth.js';

const supportRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // 20 requests per window
});

export default async function supportRoutes(fastify, options) {
  // Get user's tickets
  fastify.get('/tickets', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.userId;

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return tickets;
  });

  // Create ticket
  fastify.post('/tickets', {
    onRequest: [fastify.authenticate, supportRateLimit]
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { subject, message, category, priority } = request.body;

      // Validate input
      ticketValidators.create({ subject, message });

      const ticket = await prisma.supportTicket.create({
        data: {
          userId,
          subject,
          message,
          category: category || 'other',
          priority: priority || 'normal'
        }
      });

      // Add initial message
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: userId,
          senderType: 'user',
          message
        }
      });

      return {
        success: true,
        ticket
      };
    } catch (error) {
      if (error.message.includes('is required') || error.message.includes('must be')) {
        return reply.status(400).send({
          error: error.message
        });
      }
      throw error;
    }
  });

  // Get ticket details
  fastify.get('/tickets/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.user.userId;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        userId
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!ticket) {
      return reply.status(404).send({
        error: 'Ticket not found'
      });
    }

    return ticket;
  });

  // Add message to ticket
  fastify.post('/tickets/:id/messages', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.user.userId;
    const { message } = request.body;

    // Verify ticket belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!ticket) {
      return reply.status(404).send({
        error: 'Ticket not found'
      });
    }

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: userId,
        senderType: 'user',
        message
      }
    });

    return {
      success: true,
      message: ticketMessage
    };
  });

  // Admin: Get all tickets (with pagination)
  fastify.get('/admin/tickets', {
    onRequest: [verifyAdmin]
  }, async (request, reply) => {
    const { status, category, priority, page = 1, limit = 50 } = request.query;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.supportTicket.count({ where })
    ]);

    return {
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  });

  // Admin: Update ticket status
  fastify.put('/admin/tickets/:id', {
    onRequest: [verifyAdmin]
  }, async (request, reply) => {
    const { id } = request.params;
    const { status, assignedTo } = request.body;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(assignedTo && { assignedTo })
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    return {
      success: true,
      ticket
    };
  });

  // Admin: Add message to ticket
  fastify.post('/admin/tickets/:id/messages', {
    onRequest: [verifyAdmin]
  }, async (request, reply) => {
    const { id } = request.params;
    const { message } = request.body;
    const adminId = request.admin.id;

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: adminId,
        senderType: 'admin',
        message
      }
    });

    return {
      success: true,
      message: ticketMessage
    };
  });
}

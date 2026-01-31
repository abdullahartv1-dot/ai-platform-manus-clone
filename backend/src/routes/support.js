import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { subject, message, category, priority } = request.body;

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

    return ticket;
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

    return ticketMessage;
  });

  // Admin: Get all tickets
  fastify.get('/admin/tickets', async (request, reply) => {
    const { status, category, priority } = request.query;

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

    const tickets = await prisma.supportTicket.findMany({
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
      orderBy: { createdAt: 'desc' }
    });

    return tickets;
  });

  // Admin: Update ticket status
  fastify.put('/admin/tickets/:id', async (request, reply) => {
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

    return ticket;
  });

  // Admin: Add message to ticket
  fastify.post('/admin/tickets/:id/messages', async (request, reply) => {
    const { id } = request.params;
    const { message, adminId, adminName } = request.body;

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: adminId,
        senderType: 'admin',
        message
      }
    });

    return ticketMessage;
  });
}

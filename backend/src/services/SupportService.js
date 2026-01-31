import prisma from '../lib/prisma.js';
import { CreateTicketDTO } from '../dtos/index.js';

// Support Ticket Service - Business Logic Layer
export class SupportService {
  // Create new support ticket
  async createTicket(userId, createDTO) {
    const dto = new CreateTicketDTO(createDTO);

    // Validate input
    const errors = dto.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        message: dto.message,
        category: dto.category,
        priority: dto.priority
      }
    });

    // Add initial message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        senderType: 'user',
        message: dto.message
      }
    });

    return ticket;
  }

  // Get user's tickets
  async getUserTickets(userId) {
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
  }

  // Get ticket by ID
  async getTicketById(userId, ticketId) {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
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
      throw new Error('Ticket not found');
    }

    return ticket;
  }

  // Add message to ticket
  async addMessageToTicket(userId, ticketId, message) {
    // Verify ticket belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId
      }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        senderType: 'user',
        message
      }
    });

    return ticketMessage;
  }

  // Get all tickets (admin)
  async getAllTickets(filters) {
    const { status, category, priority, page = 1, limit = 50 } = filters;

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
  }

  // Update ticket (admin)
  async updateTicket(ticketId, updates) {
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updates,
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
  }

  // Add message to ticket (admin)
  async addAdminMessage(ticketId, adminId, message) {
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: adminId,
        senderType: 'admin',
        message
      }
    });

    return ticketMessage;
  }
}

export default new SupportService();

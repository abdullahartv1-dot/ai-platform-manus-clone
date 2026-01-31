import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { RegisterDTO, LoginDTO, UpdateProfileDTO, UpdateCustomModelsDTO } from '../dtos/index.js';

// User Service - Business Logic Layer
export class UserService {
  // Register new user
  async register(registerDTO) {
    const dto = new RegisterDTO(registerDTO);

    // Validate input
    const errors = dto.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name
      }
    });

    return user;
  }

  // Login user
  async login(loginDTO) {
    const dto = new LoginDTO(loginDTO);

    // Validate input
    const errors = dto.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    return user;
  }

  // Get user by ID
  async getUserById(userId) {
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
        lastActiveAt: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Update profile
  async updateProfile(userId, updateDTO) {
    const dto = new UpdateProfileDTO(updateDTO);

    const updateData = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.defaultModel) updateData.defaultModel = dto.defaultModel;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return user;
  }

  // Update custom models
  async updateCustomModels(userId, updateDTO) {
    const dto = new UpdateCustomModelsDTO(updateDTO);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { customModels: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const customModels = user.customModels || {};

    if (dto.provider && dto.apiKey && dto.model) {
      customModels[dto.provider] = {
        apiKey: dto.apiKey,
        model: dto.model
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        customModels,
        defaultModel: dto.model
      }
    });

    return updatedUser;
  }

  // Get user dashboard data
  async getDashboardData(userId) {
    const [user, backups, invoices, tickets] = await Promise.all([
      prisma.user.findUnique({
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
      }),
      prisma.backup.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.supportTicket.findMany({
        where: {
          userId,
          status: {
            not: 'closed'
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    return { user, backups, invoices, tickets };
  }
}

export default new UserService();

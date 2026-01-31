import prisma from '../lib/prisma.js';
import { CreatePlanDTO, UpdatePlanDTO } from '../dtos/index.js';

// Subscription Plan Service - Business Logic Layer
export class SubscriptionService {
  // Get all plans
  async getAllPlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    });

    return plans;
  }

  // Get active plans
  async getActivePlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { status: 'active' },
      orderBy: { price: 'asc' }
    });

    return plans;
  }

  // Create new plan
  async createPlan(createDTO) {
    const dto = new CreatePlanDTO(createDTO);

    // Validate input
    const errors = dto.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: + ${errors.join(', ')}`);
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        price: dto.price,
        planType: dto.planType,
        serverType: dto.serverType,
        serverSpecs: {
          cpu: dto.cpu,
          ram: dto.ram,
          storage: dto.storage,
          bandwidth: dto.bandwidth
        },
        maxUsageHours: dto.maxUsageHours,
        maxProjects: dto.maxProjects,
        backupRetentionDays: dto.backupRetentionDays,
        features: dto.features,
        status: dto.status,
        stripePriceId: dto.stripePriceId
      }
    });

    return plan;
  }

  // Update plan
  async updatePlan(planId, updateDTO) {
    const dto = new UpdatePlanDTO(updateDTO);

    const updateData = {
      ...(dto.name && { name: dto.name }),
      ...(dto.price && { price: dto.price }),
      ...(dto.planType && { planType: dto.planType }),
      ...(dto.serverType && { serverType: dto.serverType }),
      ...(dto.cpu && { serverSpecs: { cpu: dto.cpu } }),
      ...(dto.ram && { serverSpecs: { ram: dto.ram } }),
      ...(dto.storage && { serverSpecs: { storage: dto.storage } }),
      ...(dto.bandwidth && { serverSpecs: { bandwidth: dto.bandwidth } }),
      ...(dto.maxUsageHours && { maxUsageHours: dto.maxUsageHours }),
      ...(dto.maxProjects && { maxProjects: dto.maxProjects }),
      ...(dto.backupRetentionDays && { backupRetentionDays: dto.backupRetentionDays }),
      ...(dto.features && { features: dto.features }),
      ...(dto.status && { status: dto.status }),
      ...(dto.stripePriceId && { stripePriceId: dto.stripePriceId })
    };

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData
    });

    return plan;
  }

  // Delete plan
  async deletePlan(planId) {
    // Check if any users are subscribed
    const users = await prisma.user.count({
      where: { plan: planId }
    });

    if (users > 0) {
      throw new Error('Cannot delete plan with active subscribers');
    }

    await prisma.subscriptionPlan.delete({
      where: { id: planId }
    });

    return { success: true };
  }
}

export default new SubscriptionService();

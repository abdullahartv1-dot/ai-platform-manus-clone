// Subscription Plan DTOs

export class CreatePlanDTO {
  constructor(data) {
    this.name = data.name;
    this.price = Number(data.price);
    this.planType = data.planType || 'monthly';
    this.serverType = data.serverType;
    this.cpu = parseInt(data.cpu);
    this.ram = data.ram;
    this.storage = data.storage;
    this.bandwidth = data.bandwidth;
    this.maxUsageHours = parseInt(data.maxUsageHours);
    this.maxProjects = parseInt(data.maxProjects);
    this.backupRetentionDays = parseInt(data.backupRetentionDays);
    this.features = data.features || [];
    this.status = data.status || 'active';
    this.stripePriceId = data.stripePriceId;
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.length < 2) {
      errors.push('Plan name is required and must be at least 2 characters');
    }

    if (this.price < 0) {
      errors.push('Price must be positive');
    }

    if (!this.serverType) {
      errors.push('Server type is required');
    }

    if (this.cpu < 1 || this.cpu > 32) {
      errors.push('CPU must be between 1 and 32');
    }

    if (!this.ram) {
      errors.push('RAM is required');
    }

    if (!this.storage) {
      errors.push('Storage is required');
    }

    if (!this.bandwidth) {
      errors.push('Bandwidth is required');
    }

    if (this.maxUsageHours < 0) {
      errors.push('Max usage hours must be positive');
    }

    if (this.maxProjects < 0) {
      errors.push('Max projects must be positive');
    }

    if (this.backupRetentionDays < 0) {
      errors.push('Backup retention days must be positive');
    }

    return errors;
  }
}

export class UpdatePlanDTO {
  constructor(data) {
    this.name = data.name;
    this.price = data.price;
    this.planType = data.planType;
    this.serverType = data.serverType;
    this.cpu = data.cpu;
    this.ram = data.ram;
    this.storage = data.storage;
    this.bandwidth = data.bandwidth;
    this.maxUsageHours = data.maxUsageHours;
    this.maxProjects = data.maxProjects;
    this.backupRetentionDays = data.backupRetentionDays;
    this.features = data.features;
    this.status = data.status;
    this.stripePriceId = data.stripePriceId;
  }
}

export class PlanResponseDTO {
  constructor(plan) {
    this.id = plan.id;
    this.name = plan.name;
    this.price = plan.price;
    this.planType = plan.planType;
    this.serverType = plan.serverType;
    this.serverSpecs = plan.serverSpecs;
    this.maxUsageHours = plan.maxUsageHours;
    this.maxProjects = plan.maxProjects;
    this.backupRetentionDays = plan.backupRetentionDays;
    this.features = plan.features;
    this.status = plan.status;
    this.stripePriceId = plan.stripePriceId;
    this.createdAt = plan.createdAt;
    this.updatedAt = plan.updatedAt;
  }
}

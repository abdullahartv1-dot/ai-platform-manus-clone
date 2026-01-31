// User DTOs (Data Transfer Objects)
// Define the shape of data transferred between layers

export class RegisterDTO {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
  }

  validate() {
    const errors = [];

    if (!this.email || !this.email.includes('@')) {
      errors.push('Invalid email');
    }

    if (!this.password || this.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!this.name || this.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    return errors;
  }
}

export class LoginDTO {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
  }

  validate() {
    const errors = [];

    if (!this.email || !this.email.includes('@')) {
      errors.push('Invalid email');
    }

    if (!this.password) {
      errors.push('Password is required');
    }

    return errors;
  }
}

export class UpdateProfileDTO {
  constructor(data) {
    this.name = data.name;
    this.defaultModel = data.defaultModel;
  }
}

export class UpdateCustomModelsDTO {
  constructor(data) {
    this.provider = data.provider;
    this.apiKey = data.apiKey;
    this.model = data.model;
  }
}

export class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.plan = user.plan;
    this.subscriptionStatus = user.subscriptionStatus;
    this.subscriptionStartedAt = user.subscriptionStartedAt;
    this.subscriptionExpiresAt = user.subscriptionExpiresAt;
    this.serverId = user.serverId;
    this.serverIp = user.serverIp;
    this.serverStatus = user.serverStatus;
    this.defaultModel = user.defaultModel;
    this.maxUsageHours = user.maxUsageHours;
    this.maxProjects = user.maxProjects;
    this.customModels = user.customModels;
    this.lastActiveAt = user.lastActiveAt;
    this.createdAt = user.createdAt;
  }
}

export class AuthResponseDTO {
  constructor(user, token) {
    this.success = true;
    this.user = new UserResponseDTO(user);
    this.token = token;
  }
}

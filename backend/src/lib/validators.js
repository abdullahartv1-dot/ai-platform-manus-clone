// Validation schemas using simple object validation
// In production, use Zod or Joi

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

const validateRequired = (value, fieldName) => {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }
};

export const authValidators = {
  register: (data) => {
    const { email, password, name } = data;

    validateRequired(email, 'Email');
    validateRequired(password, 'Password');
    validateRequired(name, 'Name');

    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!validatePassword(password)) {
      throw new Error('Password must be at least 8 characters');
    }

    return true;
  },

  login: (data) => {
    const { email, password } = data;

    validateRequired(email, 'Email');
    validateRequired(password, 'Password');

    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    return true;
  }
};

export const ticketValidators = {
  create: (data) => {
    const { subject, message } = data;

    validateRequired(subject, 'Subject');
    validateRequired(message, 'Message');

    if (subject.length > 200) {
      throw new Error('Subject must be less than 200 characters');
    }

    if (message.length > 5000) {
      throw new Error('Message must be less than 5000 characters');
    }

    return true;
  }
};

export const subscriptionValidators = {
  create: (data) => {
    const { name, price, serverType, cpu, ram, storage, bandwidth } = data;

    validateRequired(name, 'Name');
    validateRequired(price, 'Price');
    validateRequired(serverType, 'Server Type');
    validateRequired(cpu, 'CPU');
    validateRequired(ram, 'RAM');
    validateRequired(storage, 'Storage');
    validateRequired(bandwidth, 'Bandwidth');

    if (price < 0) {
      throw new Error('Price must be positive');
    }

    if (cpu < 1 || cpu > 32) {
      throw new Error('CPU must be between 1 and 32');
    }

    return true;
  }
};

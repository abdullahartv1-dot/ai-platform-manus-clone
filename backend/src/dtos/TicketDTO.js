// Ticket DTOs

export class CreateTicketDTO {
  constructor(data) {
    this.subject = data.subject;
    this.message = data.message;
    this.category = data.category || 'other';
    this.priority = data.priority || 'normal';
  }

  validate() {
    const errors = [];

    if (!this.subject || this.subject.length === 0) {
      errors.push('Subject is required');
    }

    if (this.subject && this.subject.length > 200) {
      errors.push('Subject must be less than 200 characters');
    }

    if (!this.message || this.message.length === 0) {
      errors.push('Message is required');
    }

    if (this.message && this.message.length > 5000) {
      errors.push('Message must be less than 5000 characters');
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (this.priority && !validPriorities.includes(this.priority)) {
      errors.push('Invalid priority value');
    }

    const validCategories = ['server', 'billing', 'account', 'other'];
    if (this.category && !validCategories.includes(this.category)) {
      errors.push('Invalid category value');
    }

    return errors;
  }
}

export class TicketResponseDTO {
  constructor(ticket) {
    this.id = ticket.id;
    this.userId = ticket.userId;
    this.subject = ticket.subject;
    this.message = ticket.message;
    this.category = ticket.category;
    this.priority = ticket.priority;
    this.status = ticket.status;
    this.assignedTo = ticket.assignedTo;
    this.assignedToName = ticket.assignedToName;
    this.createdAt = ticket.createdAt;
    this.updatedAt = ticket.updatedAt;
  }
}

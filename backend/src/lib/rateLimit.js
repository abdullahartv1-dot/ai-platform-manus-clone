// Simple in-memory rate limiting
// In production, use Redis

const rateLimits = new Map();

export function createRateLimit(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100 // max requests per window
  } = options;

  return async (request, reply) => {
    const key = request.ip || request.headers['x-forwarded-for'];
    const now = Date.now();

    if (!rateLimits.has(key)) {
      rateLimits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return;
    }

    const record = rateLimits.get(key);

    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return;
    }

    // Check if exceeded
    if (record.count >= max) {
      return reply.status(429).send({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    record.count++;
  };
}

// Clean up expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimits.entries()) {
    if (now > record.resetTime) {
      rateLimits.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

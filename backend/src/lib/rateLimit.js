// Simple in-memory rate limiting
// In production, use Redis

const rateLimits = new Map();

export function createRateLimit(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100 // max requests per window
  } = options || {};

  console.log('[RateLimit] Creating rate limiter:', { windowMs, max });

  const middleware = async (request, reply) => {
    const key = request.ip || 'unknown';
    const now = Date.now();

    console.log('[RateLimit] Request from:', key);

    if (!rateLimits.has(key)) {
      rateLimits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      console.log('[RateLimit] First request, count:', 1);
      return;
    }

    const record = rateLimits.get(key);

    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      console.log('[RateLimit] Window expired, reset');
      return;
    }

    // Check if exceeded
    if (record.count >= max) {
      console.log('[RateLimit] Rate limit exceeded');
      return reply.status(429).send({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    record.count++;
    console.log('[RateLimit] Count:', record.count);
  };

  console.log('[RateLimit] Middleware created:', typeof middleware);
  return middleware;
}

// Clean up expired entries
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, record] of rateLimits.entries()) {
    if (now > record.resetTime) {
      rateLimits.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log('[RateLimit] Cleaned up', cleaned, 'expired entries');
  }
}, 60 * 1000); // Clean up every minute

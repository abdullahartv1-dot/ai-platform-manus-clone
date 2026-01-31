// Simple middleware composer
export function composeMiddleware(...middlewares) {
  return async (request, reply) => {
    for (const middleware of middlewares) {
      const result = await middleware(request, reply);

      // If middleware sends a reply (like rate limit), stop here
      if (reply.sent) {
        return;
      }
    }
  };
}

export function authMiddleware(fastify) {
  return [fastify.authenticate];
}

export function rateLimitMiddleware(limiter) {
  return [limiter];
}

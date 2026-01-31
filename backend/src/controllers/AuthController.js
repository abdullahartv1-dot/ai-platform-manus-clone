import { AuthResponseDTO } from '../dtos/index.js';
import { createRateLimit } from '../lib/rateLimit.js';
import UserService from '../services/UserService.js';

export default async function authRoutes(fastify, options) {
  // Register
  fastify.post('/register', {
    onRequest: createRateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5
    })
  }, async (request, reply) => {
    try {
      const user = await UserService.register(request.body);

      // Generate token
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email
      });

      const response = new AuthResponseDTO(user, token);

      return reply.status(201).send(response);
    } catch (error) {
      return reply.status(400).send({
        error: error.message
      });
    }
  });

  // Login
  fastify.post('/login', {
    onRequest: createRateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5
    })
  }, async (request, reply) => {
    try {
      const user = await UserService.login(request.body);

      // Generate token
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email
      });

      const response = new AuthResponseDTO(user, token);

      return reply.status(200).send(response);
    } catch (error) {
      return reply.status(401).send({
        error: error.message
      });
    }
  });

  // Get current user
  fastify.get('/me', {
    onRequest: fastify.authenticate
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const user = await UserService.getUserById(userId);

      return reply.send(user);
    } catch (error) {
      return reply.status(404).send({
        error: error.message
      });
    }
  });

  // Update profile
  fastify.put('/profile', {
    onRequest: fastify.authenticate
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const user = await UserService.updateProfile(userId, request.body);

      return reply.send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          defaultModel: user.defaultModel
        }
      });
    } catch (error) {
      return reply.status(400).send({
        error: error.message
      });
    }
  });

  // Update custom models
  fastify.put('/models', {
    onRequest: fastify.authenticate
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const user = await UserService.updateCustomModels(userId, request.body);

      return reply.send({
        success: true,
        provider: Object.keys(user.customModels || {})[0],
        model: user.defaultModel
      });
    } catch (error) {
      return reply.status(400).send({
        error: error.message
      });
    }
  });
}

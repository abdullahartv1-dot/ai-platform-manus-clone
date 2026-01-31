import prisma from './prisma.js';

// Middleware to verify admin role
export async function verifyAdmin(request, reply) {
  try {
    await request.jwtVerify();

    const userId = request.user.userId;

    // Get user with admin role
    const admin = await prisma.admin.findUnique({
      where: { id: userId }
    });

    if (!admin) {
      return reply.status(403).send({
        error: 'Admin access required'
      });
    }

    // Attach admin info to request
    request.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    return;
  } catch (err) {
    return reply.status(401).send({
      error: 'Unauthorized'
    });
  }
}

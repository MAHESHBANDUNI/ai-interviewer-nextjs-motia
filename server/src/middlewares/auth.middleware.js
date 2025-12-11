import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/apiError.util';

export const authMiddleware = async (req, ctx, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Not authorized, no token');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      throw new ApiError(401, 'Invalid token');
    }

    const freshUser = await prisma.user.findFirst({ where: { userId: decoded.userId } });
    if (!freshUser) {
      throw new ApiError(401, 'User belonging to this token no longer exists');
    }

    req.user = freshUser; // Attach user to request object

    return await next();
  } catch (error) {
    ctx.logger.error("Auth error", { error });
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }
};

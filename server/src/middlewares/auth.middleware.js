import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export const authMiddleware = async (req, ctx, next) => {
    try{
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
          token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            //   return next(new ApiError(401, 'Not authorized, no token'));
            return { status: 401, body: { error: 'Not authorized, no token' } }
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const freshUser = await prisma.user.findFirst({ where: { userId: decoded.userId } });
        if (!freshUser) {
        //   return next(new ApiError(401, 'User belonging to this token no longer exists'));
          return { status: 401, body: { error: 'User belonging to this token no longer exists' } }
        }
        req.user = freshUser; // Attach user to request object
        next();
    }
    catch(error){
        return {status: 401, body:{error: 'Your session has expired. Please sign in again.'}};
    }
}
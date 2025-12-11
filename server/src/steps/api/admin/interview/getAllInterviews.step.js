import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';

export const config = {
    name: 'GetAllInterviews',
    type : 'api',
    path : '/api/admin/interview/list',
    method: 'GET',
    description: 'Get all interviews endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        const {userId} = await req.body;
        const result = await AdminService.getAllInterviews(userId);
        if(!result){
            logger.error('Failed to retreived interviews');
            throw new Error('Failed to retreived interviews',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Interviews retreived successfully',
            interviews: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to retreive interviews', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
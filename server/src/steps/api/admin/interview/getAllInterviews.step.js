import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { corsMiddleware } from '../../../../middlewares/cors.middleware';

export const config = {
    name: 'GetAllInterviews',
    type : 'api',
    path : '/api/admin/interviews/list',
    method: 'GET',
    description: 'Get all interviews endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        logger.info('Processing get all interviews request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const result = await AdminService.getAllInterviews(userId);
        if(!result){
          logger.error('Failed to retreived interviews');
          return {
            status: 400,
            body: {
              error: 'Failed to retreived interviews'
            }
          }
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
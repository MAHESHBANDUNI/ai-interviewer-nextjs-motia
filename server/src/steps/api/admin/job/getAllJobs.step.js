import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { corsMiddleware } from '../../../../middlewares/cors.middleware';

export const config = {
    name: 'GetAllJobs',
    type : 'api',
    path : '/api/admin/job/list',
    method: 'GET',
    description: 'Get all jobs positions endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        logger.info('Processing get all jobs positions request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const { status } = req?.queryParams;
        const result = await AdminService.getAllJobs({userId, status});
        if(!result){
          logger.error('Failed to get all jobs position job');
          return {
            status: 400,
            body: {
              error: 'Failed to get all jobs position job'
            }
          }
        }
        return {
          status: 200,
          body: {
            message: 'List of all jobs positions retrieved successfully',
            jobs: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to get all jobs positions', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
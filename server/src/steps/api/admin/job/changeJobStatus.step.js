import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { corsMiddleware } from '../../../../middlewares/cors.middleware';

export const config = {
    name: 'ChangeJobStatus',
    type : 'api',
    path : '/api/admin/job/status',
    method: 'PUT',
    description: 'Change job status endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        logger.info('Processing change job status request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const {jobId} = await req.body;
        const result = await AdminService.changeJobStatus({userId, jobId});
        if(!result){
          logger.error('Failed to change job status');
          return {
            status: 400,
            body: {
              error: 'Failed to change job status'
            }
          }
        }
        return {
          status: 200,
          body: {
            message: 'Job status changed successfully',
            job: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to change job status', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
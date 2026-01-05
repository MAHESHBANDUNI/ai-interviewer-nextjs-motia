import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { corsMiddleware } from '../../../../middlewares/cors.middleware';

export const config = {
    name: 'UpdateJobPosition',
    type : 'api',
    path : '/api/admin/job/update',
    method: 'PUT',
    description: 'Update job position endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        logger.info('Processing update job position request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const {jobPositionName, jobId, jobDescription} = await req.body;
        const result = await AdminService.updateJob({userId, jobPositionName, jobId, jobDescription});
        if(!result){
          logger.error('Failed to update job position');
          return {
            status: 400,
            body: {
              error: 'Failed to update job position'
            }
          }
        }
        return {
          status: 200,
          body: {
            message: 'Job position updated successfully',
            job: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to update job position', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
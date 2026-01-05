import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { corsMiddleware } from '../../../../middlewares/cors.middleware';

export const config = {
    name: 'CreateJobPosition',
    type : 'api',
    path : '/api/admin/job/create',
    method: 'POST',
    description: 'Create job position endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        logger.info('Processing create new job position request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const {jobPositionName, jobDescription} = await req.body;
        const result = await AdminService.createJob({userId, jobPositionName, jobDescription});
        if(!result){
          logger.error('Failed to create new position job');
          return {
            status: 400,
            body: {
              error: 'Failed to create new position job'
            }
          }
        }
        return {
          status: 200,
          body: {
            message: 'Job position created successfully',
            job: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to create new job position', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
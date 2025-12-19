import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { corsMiddleware } from '../../../../middlewares/cors.middleware';

export const config = {
    name: 'GetCandidateResumeProfile',
    type : 'api',
    path : '/api/admin/candidate/resume/profile',
    method: 'POST',
    description: 'Get candidate resume profile endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
       logger.info('Processing retrieving candidate resume profile request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const {candidateId} = await req.body;
        const result = await AdminService.getCandidateResumeProfile({candidateId, userId});
        if(!result){
          logger.error('Failed to retrieve candidate resume profile');
          return {
            status: 400,
            body: {
              error: 'Failed to retrieve candidate resume profile'
            }
          }
        }
        return {
          status: 200,
          body: {
            message: 'Canidate resume profile retrieved successfully',
            resumeProfile: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to retrieve candidate resume profile', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
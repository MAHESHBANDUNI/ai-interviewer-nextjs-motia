import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { authMiddleware } from '../../../../middlewares/auth.middleware';

export const config = {
    name: 'GetAllCandidates',
    type : 'api',
    path : '/api/admin/candidate/list',
    method: 'GET',
    description: 'Get all candidates endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
  try{
    logger.info('Processing retrieve all candidates list request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
    let userId = await req?.user?.userId;
    const result = await AdminService.getAllCandidates(userId);
    if(!result){
        logger.error('Failed to retreived candidates');
        return {
          status: 400,
          body: {
            error: 'Failed to retreived candidates'
          }
        }
    }
    return {
      status: 200,
      body: {
        message: 'Candidates retreived successfully',
        candidates: result
      }
    };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to retreive candidates', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
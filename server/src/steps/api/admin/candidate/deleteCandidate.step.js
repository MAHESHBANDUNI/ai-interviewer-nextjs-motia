import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';

export const config = {
    name: 'DeleteCandidate',
    type : 'api',
    path : '/api/admin/candidate/delete',
    method: 'DELETE',
    description: 'Delete candidate endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        logger.info('Processing delete candidate request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const {candidateId} = await req.body;
        const result = await AdminService.deleteCandidate({candidateId, userId});
        if(!result){
          logger.error('Failed to delete candidate');
          return {
            status: 400,
            body: {
              error: 'Failed to delete candidate'
            }
          }
        } 
        return {
          status: 200,
          body: {
            message: 'Candidate deleted successfully',
            candidate: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to delete candidate', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
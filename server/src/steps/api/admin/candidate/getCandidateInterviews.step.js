import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';

export const config = {
    name: 'GetCandidateInterviews',
    type : 'api',
    path : '/api/admin/candidate/interviews/list',
    method: 'POST',
    description: 'Get candidates interviews endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        const {candidateId, adminId} = await req.json();
        const result = await AdminService.getCandidateInterviews(candidateId, adminId);
        if(!result){
          logger.error('Failed to get candidate interviews');
          return {
            status: 400,
            body: {
              error: 'Failed to get candidate interviews'
            }
          }
        }
        return {
          status: 200,
          body: {
            message: 'Canidate interviews retrieved successfully',
            interviews: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to retreive candidate interviews', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
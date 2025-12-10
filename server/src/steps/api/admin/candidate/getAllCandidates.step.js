import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { ApiError } from '../../../../utils/apiError.util';

export const config = {
    name: 'GetAllCandidates',
    type : 'api',
    path : '/api/admin/candidate/list',
    method: 'GET',
    description: 'Get all candidates endpoint',
    emits: [],
    flows: [],
    middleware: [authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
  try{
    let userId = await req.user.userId;
    logger.info("userId",userId);
    const result = await AdminService.getAllCandidates(userId);
    logger.info("result",result);
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
        logger.error('Failed to retreive candidates', { error: error.message, code: error.code });
      }
      return {
        status: error.code || 500,
        body: {
          message: error.message || 'Internal server error'
        }
      };
    }
}
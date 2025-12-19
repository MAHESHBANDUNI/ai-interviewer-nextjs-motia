import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { corsMiddleware } from '../../../../middlewares/cors.middleware';

export const config = {
    name: 'CancelInterview',
    type : 'api',
    path : '/api/admin/interview/cancel',
    method: 'PUT',
    description: 'Cancel interview endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        logger.info('Processing cancel interview request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const interviewId = await req?.body?.interviewId;
        const cancellationReason = await req.body.cancellationReason;
        if(!interviewId || !userId){
          return {
            status: 400,
            body: {
              error: 'Missing fields'
            }
          }
        }
        const result = await AdminService.cancelInterview({userId, interviewId, cancellationReason});
        if(!result){
          logger.error('Failed to cancel interview');
          return {
            status: 400,
            body: {
              error: 'Failed to cancel interview'
            }
          }
        }
        return {
          status: 200,
          body: {
            message: 'Interview cancelled successfully',
            interview: result
          }
        };
    }
    catch (error) {
        if (logger) {
          logger.error('Failed to cancel interview', { error: error.message, status: error.status });
        }
        return {
          status: error.status || 500,
          body: {
            error: error.message || 'Internal server error'
          }
        };
    }
}
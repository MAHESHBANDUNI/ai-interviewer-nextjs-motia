import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';

export const config = {
    name: 'CancelInterview',
    type : 'api',
    path : '/api/admin/interview/cancel',
    method: 'POST',
    description: 'Cancel interview endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        logger.info('Processing cancel interview request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const {interviewId} = await req.body;
        const result = await AdminService.cancelInterview(userId, interviewId);
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
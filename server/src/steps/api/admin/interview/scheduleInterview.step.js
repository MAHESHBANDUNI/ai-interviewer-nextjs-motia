import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { corsMiddleware } from '../../../../middlewares/cors.middleware';

export const config = {
    name: 'ScheduleInterview',
    type : 'api',
    path : '/api/admin/interview/schedule',
    method: 'POST',
    description: 'Schedule interview endpoint',
    emits: ['schedule-interview-mail'],
    flows: ['interview-scheduling-flow'],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        logger.info('Processing schedule interview request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const {jobId, candidateId, datetime, duration} = await req.body;
        const result = await AdminService.scheduleInterview({userId, jobId, candidateId, datetime, duration});
        if(!result){
          logger.error('Failed to schedule interview');
          return {
            status: 400,
            body: {
              error: 'Failed to schedule interview'
            }
          }
        }
        if (emit) {
          await emit({
            topic: 'schedule-interview-mail',
            data: {
              mailDetails: result
            }
          });
        }
        return {
          status: 200,
          body: {
            message: 'Interview scheduled successfully',
            interview: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to retreive interviews', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
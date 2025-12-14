import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';

export const config = {
    name: 'RescheduleInterview',
    type : 'api',
    path : '/api/admin/interview/reschedule',
    method: 'PUT',
    description: 'Reschedule interview endpoint',
    emits: ['reschedule.interview.mail'],
    flows: ['interview-rescheduling-flow'],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        const userId = await req?.user?.userId;
        const {candidateId, duration, interviewId, newDatetime, oldDatetime} = await req.body;
        const result = await AdminService.rescheduleInterview({userId, candidateId, interviewId, duration, newDatetime, oldDatetime});
        if(!result){
          logger.error('Failed to reschedule interview');
          return {
            status: 400,
            body: {
              error: 'Failed to reschedule interview'
            }
          }
        }
        if (emit) {
          await emit({
            topic: 'reschedule.interview.mail',
            data: {
              mailDetails: result
            }
          });
        }
        return {
          status: 200,
          body: {
            message: 'Interview rescheduled successfully',
            interview: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to reschedule interview', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
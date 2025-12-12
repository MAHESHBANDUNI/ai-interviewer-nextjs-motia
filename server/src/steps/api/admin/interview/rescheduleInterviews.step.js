import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';

export const config = {
    name: 'RescheduleInterview',
    type : 'api',
    path : '/api/admin/interview/reschedule',
    method: 'POST',
    description: 'Reschedule interview endpoint',
    emits: ['reschedule.interview.mail'],
    flows: ['interview-rescheduling-flow'],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) => {
    try{
        const userId = await req?.user?.userId;
        const formData = await req.formData();
        const candidateId = formData.get("candidateId");
        const interviewId = formData.get("interviewId");
        const newDatetime = formData.get("newDatetime");
        const oldDatetime = formData.get("oldDatetime");
        const duration = formData.get("duration");
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
              mailDetails: result?.mailDetails
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
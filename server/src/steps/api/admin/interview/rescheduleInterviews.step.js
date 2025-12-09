import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'RescheduleInterview',
    type : 'api',
    path : '/admin/interview/reschedule',
    method: 'POST',
    description: 'Reschedule interview endpoint',
    emits: ['reschedule.interview.mail'],
    flows: ['interview-rescheduling-flow'],
}

export const handler = async(req, {emit, logger}) => {
    try{
        const formData = await req.formData();
        const candidateId = formData.get("candidateId");
        const interviewId = formData.get("interviewId");
        const newDatetime = formData.get("newDatetime");
        const oldDatetime = formData.get("oldDatetime");
        const duration = formData.get("duration");
        const adminId = formData.get("adminId");
        const result = await AdminService.rescheduleInterview({adminId, candidateId, interviewId, duration, newDatetime, oldDatetime});
        if(!result.ok){
            logger.error('Failed to reschedule interview');
            throw new Error('Failed to reschedule interview',{status: 400})
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
    catch(err){
        logger.error('Failed to reschedule interview',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
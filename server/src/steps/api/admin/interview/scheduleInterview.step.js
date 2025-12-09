import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'ScheduleInterview',
    type : 'api',
    path : '/admin/interview/schedule',
    method: 'POST',
    description: 'Schedule interview endpoint',
    emits: ['schedule.interview.mail'],
    flows: ['interview-scheduling-flow'],
}

export const handler = async(req, {emit, logger}) => {
    try{
        const formData = await req.formData();
        const candidateId = formData.get("candidateId");
        const datetime = formData.get("datetime");
        const duration = formData.get("duration");
        const adminId = formData.get("adminId");
        const result = await AdminService.scheduleInterview({adminId, candidateId, datetime, duration});
        if(!result.ok){
            logger.error('Failed to schedule interview');
            throw new Error('Failed to schedule interview',{status: 400})
        }
        if (emit) {
          await emit({
            topic: 'schedule.interview.mail',
            data: {
              mailDetails: result?.mailDetails
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
    catch(err){
        logger.error('Failed to schedule interview',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
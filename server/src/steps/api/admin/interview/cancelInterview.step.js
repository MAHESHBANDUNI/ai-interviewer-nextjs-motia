import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'CancelInterview',
    type : 'api',
    path : '/admin/interview/cancel',
    method: 'POST',
    description: 'Cancel interview endpoint',
    emits: [],
    flows: [],
}

export const handler = async(req, {emit, logger}) => {
    try{
        const {interviewId, adminId} = await req.json();
        const result = await AdminService.cancelInterview(adminId, interviewId);
        if(!result.ok){
            logger.error('Failed to cancel interview');
            throw new Error('Failed to cancel interview',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Interview cancelled successfully',
            interview: result
          }
        };
    }
    catch(err){
        logger.error('Failed to cancel interview',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
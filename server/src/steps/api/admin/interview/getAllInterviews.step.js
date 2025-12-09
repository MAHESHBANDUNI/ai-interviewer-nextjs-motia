import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'GetAllInterviews',
    type : 'api',
    path : '/admin/interview/list',
    method: 'POST',
    description: 'Get all interviews endpoint',
    emits: [],
    flows: [],
}

export const handler = async(req, {emit, logger}) => {
    try{
        const {adminId} = await req.json();
        const result = await AdminService.getAllInterviews(adminId);
        if(!result.ok){
            logger.error('Failed to retreived interviews');
            throw new Error('Failed to retreived interviews',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Interviews retreived successfully',
            interviews: result
          }
        };
    }
    catch(err){
        logger.error('Failed to retreived interviews',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
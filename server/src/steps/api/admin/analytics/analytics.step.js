import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'GetAnalytics',
    type : 'api',
    path : '/admin/analytics',
    method: 'POST',
    description: 'Get dashboard analytics endpoint',
    emits: [],
    flows: [],
}

export const handler = async(req, {emit, logger}) => {
    try{
        const {adminId} = await req.json();
        const result = await AdminService.getAnalytics(adminId);
        if(!result.ok){
            logger.error('Failed to get analytics');
            throw new Error('Failed to get analytics',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Retrieved analytics successfully',
            analytics: result
          }
        };
    }
    catch(err){
        logger.error('Failed to retrieve analytics',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
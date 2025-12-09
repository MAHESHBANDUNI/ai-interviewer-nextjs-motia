import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'GetAllCandidates',
    type : 'api',
    path : '/admin/candidate/list',
    method: 'POST',
    description: 'Get all candidates endpoint',
    emits: [],
    flows: [],
}

export const handler = async(req, {emit, logger}) => {
    try{
        const {adminId} = await req.json();
        const result = await AdminService.getAllCandidates(adminId);
        if(!result.ok){
            logger.error('Failed to retreived candidates');
            throw new Error('Failed to retreived candidates',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Candidates retreived successfully',
            candidate: result
          }
        };
    }
    catch(err){
        logger.error('Failed to retreived candidates',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
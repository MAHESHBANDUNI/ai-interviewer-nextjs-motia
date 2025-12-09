import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'GetCandidateInterviews',
    type : 'api',
    path : '/admin/candidate/interviews/list',
    method: 'POST',
    description: 'Get candidates interviews endpoint',
    emits: [],
    flows: [],
}

export const handler = async(req, {emit, logger}) => {
    try{
        const {candidateId, adminId} = await req.json();
        const result = await AdminService.getCandidateInterviews(candidateId, adminId);
        if(!result.ok){
            logger.error('Failed to get candidate interviews');
            throw new Error('Failed to get candidate interviews',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Canidate interviews retrieved successfully',
            interviews: result
          }
        };
    }
    catch(err){
        logger.error('Failed to retrieve candidate interviews',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'GetCandidateResumeProfile',
    type : 'api',
    path : '/admin/candidate/resume/profile',
    method: 'POST',
    description: 'Get candidate resume profile endpoint',
    emits: [],
    flows: [],
}

export const handler = async(req, {emit, logger}) => {
    try{
        const {candidateId, adminId} = await req.json();
        const result = await AdminService.getCandidateResumeProfile(candidateId, adminId);
        if(!result.ok){
            logger.error('Failed to get candidate resume profile');
            throw new Error('Failed to get candidate resume profile',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Canidate resume profile retrieved successfully',
            resumeProfile: result
          }
        };
    }
    catch(err){
        logger.error('Failed to retrieve candidate resume profile',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
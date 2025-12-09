import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'DeleteCandidate',
    type : 'api',
    path : '/admin/candidate/delete',
    method: 'DELETE',
    description: 'Delete candidate endpoint',
    emits: [],
    flows: [],
}

export const handler = async(req, {emit, logger}) => {
    try{
        const {candidateId, adminId} = await req.json();
        const result = await AdminService.deleteCandidate(candidateId, adminId);
        if(!result.ok){
            logger.error('Failed to delete candidate');
            throw new Error('Failed to delete candidate',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Candidate deleted successfully',
            candidate: result
          }
        };
    }
    catch(err){
        logger.error('Failed to delete candidate',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
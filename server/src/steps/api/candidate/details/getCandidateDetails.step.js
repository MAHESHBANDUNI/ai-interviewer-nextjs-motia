import { z } from "zod";
import { CandidateService } from "../../../../services/candidate/candidate.service";

export const config = {
    name: 'GetCandidateDetails',
    type : 'api',
    path : '/candidate/details',
    method: 'POST',
    description: 'Get candidates details endpoint',
    emits: [],
    flows: [],
}

export const handler = async(req, {emit, logger}) =>{
    try{
        const {candidateId} = await req.json();
        const result = await CandidateService.getCandidateDetails({candidateId});
        if(!result.ok){
            logger.error('Failed to get candidate details');
            throw new Error('Failed to get candidate details',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Canidate details retrieved successfully',
            candidate: result
          }
        };
    }
    catch(err){
        logger.error('Failed to retrieve candidate details',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
import { z } from "zod";
import { CandidateService } from "../../../../services/candidate/candidate.service";

export const config = {
    name: 'GetCandidateDetails',
    type : 'api',
    path : '/api/candidate/details',
    method: 'POST',
    description: 'Get candidates details endpoint',
    emits: [],
    flows: [],
}

export const handler = async(req, {emit, logger}) =>{
    try{
        const {candidateId} = await req.body;
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
    catch (error) {
      if (logger) {
        logger.error('Failed to get candidate details', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
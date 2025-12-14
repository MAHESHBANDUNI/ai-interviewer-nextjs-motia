import { z } from "zod";
import { CandidateService } from "../../../../services/candidate/candidate.service";

export const config = {
    name: 'GetInterviewDetails',
    type : 'api',
    path : '/api/candidate/interview/:id',
    method: 'POST',
    description: 'Get interview details endpoint',
    emits: [],
    flows: [],
}

export const handler = async(req, {emit, logger}) =>{
    try{
        const { interviewId } = await params;
        const {candidateId} = await request.json();
        const result = await CandidateService.getInterviewDetails({candidateId, interviewId});
        if(!result.ok){
            logger.error('Failed to get interview details');
            throw new Error('Failed to get interview details',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Interview details retrieved successfully',
            interview: result
          }
        };
    }
    catch(err){
        logger.error('Failed to retrieve interview details',err);
        return {
          status: 500,
          body: {
            message: 'Internal server error'
          }
        };
    }
}
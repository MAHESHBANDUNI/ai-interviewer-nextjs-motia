import { z } from "zod";
import { CandidateService } from "../../../../services/candidate/candidate.service";
import { authMiddleware } from "../../../../middlewares/auth.middleware";
import { errorHandlerMiddleware } from "../../../../middlewares/errorHandler.middleware";

export const config = {
    name: 'GetInterviewDetails',
    type : 'api',
    path : '/api/candidate/interview/:id',
    method: 'POST',
    description: 'Get interview details endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) =>{
    try{
        logger.info('Processing get interview details request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const { id } = await params;
        const userId = await req?.user?.userId;
        const result = await CandidateService.getInterviewDetails({interviewId: id, userId});
        if(!result){
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
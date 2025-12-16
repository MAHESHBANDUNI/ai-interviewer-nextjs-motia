import { z } from "zod";
import { CandidateService } from "../../../../services/candidate/candidate.service";
import { authMiddleware } from "../../../../middlewares/auth.middleware";
import { errorHandlerMiddleware } from "../../../../middlewares/errorHandler.middleware";

export const config = {
    name: 'GetInterviewDetails',
    type : 'api',
    path : '/api/candidate/interview/:id',
    method: 'GET',
    description: 'Get interview details endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) =>{
    try{
        logger.info('Processing get interview details request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const interviewId = await req?.pathParams?.id;
        const userId = await req?.user?.userId;
        if(!interviewId || !userId){
          return {
            status: 400,
            body: {
              error: 'Missing fields'
            }
          }
        }
        const result = await CandidateService.getInterviewDetails(interviewId, userId);
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
    catch (error) {
      if (logger) {
        logger.error('Failed to retrieve interview details', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
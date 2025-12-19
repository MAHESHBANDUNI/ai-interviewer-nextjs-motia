import { z } from "zod";
import { CandidateService } from "../../../../services/candidate/candidate.service";
import { errorHandlerMiddleware } from "../../../../middlewares/errorHandler.middleware";
import { authMiddleware } from "../../../../middlewares/auth.middleware";
import { corsMiddleware } from "../../../../middlewares/cors.middleware";

export const config = {
    name: 'GetCandidateDetails',
    type : 'api',
    path : '/api/candidate/details',
    method: 'GET',
    description: 'Get candidates details endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) =>{
    try{

        logger.info('Processing get candidate details request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const result = await CandidateService.getCandidateDetails(userId);
        if(!result){
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
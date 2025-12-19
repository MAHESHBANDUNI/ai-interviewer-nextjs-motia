import { z } from "zod";
import { CandidateService } from "../../../../services/candidate/candidate.service";
import { errorHandlerMiddleware } from "../../../../middlewares/errorHandler.middleware";
import { authMiddleware } from "../../../../middlewares/auth.middleware";
import { corsMiddleware } from "../../../../middlewares/cors.middleware";

export const config = {
    name: 'GetCandidateInterviewsDetails',
    type : 'api',
    path : '/api/candidate/interviews/list',
    method: 'GET',
    description: 'Get candidate interviews details endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) =>{
    try{
        logger.info('Processing get candidate interviews request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        if(!userId){
          return {
            status: 400,
            body: {
              error: 'Missing fields'
            }
          }
        }
        const result = await CandidateService.getCandidateInterviews(userId);
        if(!result){
            logger.error('Failed to retrieve interviews list');
            throw new Error('Failed to retrieve interviews list',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Interview list retrieved successfully',
            interviews: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to retrieve interviews list', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
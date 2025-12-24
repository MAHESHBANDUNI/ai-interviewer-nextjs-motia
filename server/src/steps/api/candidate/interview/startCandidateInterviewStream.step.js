import { z } from "zod";
import { CandidateService } from "../../../../services/candidate/candidate.service";
import { errorHandlerMiddleware } from "../../../../middlewares/errorHandler.middleware";
import { authMiddleware } from "../../../../middlewares/auth.middleware";
import { corsMiddleware } from "../../../../middlewares/cors.middleware";

export const config = {
    name: 'StartCandidateInterviewStream',
    type : 'api',
    path : '/api/candidate/interview/stream',
    method: 'POST',
    description: 'Start candidate interview stream endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) =>{
    try{
        logger.info('Processing start candidate interview stream request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const userId = await req?.user?.userId;
        const interviewId = req?.body?.interviewId;
        if(!interviewId || !userId){
          return {
            status: 400,
            body: {
              error: 'Missing fields'
            }
          }
        }
        const result = await CandidateService.startCandidateInterviewStream({interviewId, userId, logger});
        if(!result){
            logger.error('Failed to start candidate interview stream');
            throw new Error('Failed to start candidate interview stream',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Candidate interview stream started successfully',
            data: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to start candidate interview stream', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
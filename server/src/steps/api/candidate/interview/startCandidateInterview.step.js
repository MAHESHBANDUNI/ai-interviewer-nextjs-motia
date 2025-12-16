import { z } from "zod";
import { CandidateService } from "../../../../services/candidate/candidate.service";
import { errorHandlerMiddleware } from "../../../../middlewares/errorHandler.middleware";
import { authMiddleware } from "../../../../middlewares/auth.middleware";

export const config = {
    name: 'StartCandidateInterviewSession',
    type : 'api',
    path : '/api/candidate/interview/start',
    method: 'POST',
    description: 'Start interview session endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) =>{
    try{
        logger.info('Processing start interview session request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
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
        const result = await CandidateService.startInterview({interviewId, userId, logger});
        if(!result){
            logger.error('Failed to start interview session');
            throw new Error('Failed to start interview session',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Interview session started successfully',
            data: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to start interview session', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
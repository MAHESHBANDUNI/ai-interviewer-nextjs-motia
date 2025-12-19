import { authMiddleware } from "../../../../../middlewares/auth.middleware";
import { corsMiddleware } from "../../../../../middlewares/cors.middleware";
import { errorHandlerMiddleware } from "../../../../../middlewares/errorHandler.middleware";
import { CandidateService } from "../../../../../services/candidate/candidate.service";

export const config = {
    name: 'StartInterviewSession',
    type: 'api',
    path: '/api/candidate/interview/session/start',
    method: 'POST',
    description: 'Start interview session endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async (req,{emit, logger}) => {
    try{
        logger.info('Processing start interview session request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp : new Date().toISOString() })
        const userId = await req?.user?.userId;
        const interviewId = req?.body?.interviewId;
        const result = await CandidateService.startInterviewSession(userId, interviewId);
        if(!result){
            logger.error('Failed to start interview session');
            return {
              status: 400,
              body: {
                error: 'Failed to start interview session'
              }
            };
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
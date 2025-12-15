import { authMiddleware } from "../../../../../middlewares/auth.middleware";
import { errorHandlerMiddleware } from "../../../../../middlewares/errorHandler.middleware";
import { CandidateService } from "../../../../../services/candidate/candidate.service";

export const config = {
    name: 'GenerateInterviewQuestion',
    type: 'api',
    path: '/api/candidate/interview/session/conversation/generate',
    method: 'POST',
    description: 'Generate interview question endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async (req,{emit, logger}) => {
    try{
        logger.info('Processing generate interview question request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp : new Date().toISOString() })
        const userId = await req?.user?.userId;
        const { interviewId, candidate, remainingDuration, interviewDuration } = req?.body;
        const result = await CandidateService.generateInterviewQuestion({logger, userId, interviewId, candidate, remainingDuration, interviewDuration });
        if(!result){
            logger.error('Failed to generate interview question');
            return {
              status: 400,
              body: {
                error: 'Failed to generate interview question'
              }
            };
        }
        return {
          status: 200,
          body: {
            data: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to generate interview question', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
import { authMiddleware } from "../../../../../middlewares/auth.middleware";
import { errorHandlerMiddleware } from "../../../../../middlewares/errorHandler.middleware";
import { CandidateService } from "../../../../../services/candidate/candidate.service";

export const config = {
    name: 'GenerateResponse',
    type: 'api',
    path: '/api/candidate/interview/session/response',
    method: 'POST',
    description: 'Generate Response endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async (req,{emit, logger}) => {
    try{
        logger.info('Processing generate response request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp : new Date().toISOString() })
        const userId = await req?.user?.userId;
        const { question, candidateAnswer, interviewId } = req.body;
        const result = await CandidateService.generateResponse({ userId, question, candidateAnswer, interviewId });
        if(!result){
            logger.error('Failed to generate response');
            return {
              status: 400,
              body: {
                error: 'Failed to generate response'
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
        logger.error('Failed to generate response', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
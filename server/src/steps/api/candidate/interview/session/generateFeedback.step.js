import { authMiddleware } from "../../../../../middlewares/auth.middleware";
import { errorHandlerMiddleware } from "../../../../../middlewares/errorHandler.middleware";
import { CandidateService } from "../../../../../services/candidate/candidate.service";

export const config = {
    name: 'GenerateFeedback',
    type: 'api',
    path: '/api/candidate/interview/session/conversation/feedback',
    method: 'POST',
    description: 'Generate feedback endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async (req,{emit, logger}) => {
    try{
        logger.info('Processing generate feedback request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp : new Date().toISOString() });
        logger.info("Request: ",req.body);
        const userId = await req?.user?.userId;
        const { question, candidateAnswer, difficultyLevel, interviewId, resumeProfile, section } = req.body;
        const result = await CandidateService.generateFeedback({ userId, question, candidateAnswer, difficultyLevel, interviewId, resumeProfile, section, logger });
        if(!result){
            logger.error('Failed to generate feedback');
            return {
              status: 400,
              body: {
                error: 'Failed to generate feedback'
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
        logger.error('Failed to generate feedback', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
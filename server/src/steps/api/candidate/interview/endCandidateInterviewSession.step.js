import { CandidateService } from "../../../../services/candidate/candidate.service";
import { errorHandlerMiddleware } from "../../../../middlewares/errorHandler.middleware";
import { authMiddleware } from "../../../../middlewares/auth.middleware";

export const config = {
    name: 'EndCandidateInterviewSession',
    type: 'api',
    path: '/api/candidate/interview/end',
    method: 'POST',
    description: 'End interview session endpoint',
    emits: ['generate.candidate.interview.profile'],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async (req,{emit, logger}) => {
    try{
        logger.info('Processing end interview session request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp : new Date().toISOString() })
        const userId = await req?.user?.userId;
        const { interviewId, completionMin, interviewConversation } = req.body;
        if(!interviewId || !userId  || !completionMin || !interviewConversation){
          return {
            status: 400,
            body: {
              error: 'Missing fields'
            }
          }
        }
        const result = await CandidateService.endInterview({userId, interviewId, completionMin, interviewConversation});
        if(!result){
            logger.error('Failed to end interview session');
            return {
              status: 400,
              body: {
                error: 'Failed to end interview session'
              }
            };
        }

        // Emit event for interview processing if required
        if (emit) {
          await emit({
            topic: 'generate.candidate.interview.profile',
            data: {
              candidateId: userId,
              interviewId: interviewId
            }
          });
        }

        return {
          status: 200,
          body: {
            message: result?.message || 'Interview session ended successfully',
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to end interview session', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
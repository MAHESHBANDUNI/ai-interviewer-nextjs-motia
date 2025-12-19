import { CandidateService } from "../../../../services/candidate/candidate.service";

export const config = {
    name: 'GenerateCandidateInterviewProfile',
    type: 'event',
    description: 'Generates interview profile in the background',
    subscribes: ['generate-candidate-interview-profile'],
    emits: []
}

export const handler = async (input, {emit, logger, state}) => {
    try{
        logger.info('Processing interview profile generation request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp : new Date().toISOString() })
        const { candidateId, interviewId, interviewConversation } = input;
        const result = await CandidateService.generateCandidateInterviewProfile({ candidateId, interviewId, interviewConversation, logger });
        if(!result){
            logger.error('Failed to generate interview profile');
            return {
              status: 400,
              body: {
                error: 'Failed to generate interview profile'
              }
            };
        }
        if(result?.success){
            return {
              status: 200,
              body: {
                message: 'Interview profile generated successfully',
                interviewProfile: result?.interviewProfile
              }
            };
        }
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to generate interview profile', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
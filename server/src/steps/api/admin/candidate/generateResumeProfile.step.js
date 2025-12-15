import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'GenerateResumeProfile',
    type : 'event',
    description: 'Generates resume profile in the background',
    subscribes: ['generate.resume.profile'],
    emits: [],
    flows: ['candidate-onboarding-flow'],
}

export const handler = async(input, context) => {
  try{ 
      logger.info('Processing candidate resume generation request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
      const { emit, logger, state } = context || {};
      let {resumeUrl, candidateId} = input;
      if(!resumeUrl || !candidateId){
        logger.error('Failed to parse candidate resume. Missing fields.');
        return ;
      }
        const result = await AdminService.parseCandidateResume({candidateId, resumeUrl, logger});
        if(!result){
            logger.error('Failed to parse candidate resume');
            return {
              status: 400,
              body: {
                error: 'Failed to parse candidate resume'
              }
            }
        }
        if(result?.success){
          return {
              status: 200,
              body: {
                message: 'Candidate resume parsed successfully',
                resumeProfile: result?.resumeProfile
              }
            }
        }
    }
    catch(error){
      if (logger) {
        logger.error('Failed to parse candidate resume', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: { error: error.message || 'Internal server error' }
      };
    }
}
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
    const { emit, logger, state } = context || {};
    let arrayBuffer, candidateId = input.data;
    if(!arrayBuffer || !candidateId){
      logger.error('Failed to parse candidate resume. Missing fields.');
      return ;
    }
    try{
        const result = AdminService.parseCandidateResume({candidateId, arrayBuffer});
        if(!result){
            logger.error('Failed to parse candidate resume');
            return {
              status: 400,
              body: {
                error: 'Failed to parse candidate resume'
              }
            }
        }
        if(result.success){
          logger.info('Candidate resume parsed successfully')
          return ;
        }
    }
    catch(err){
        logger.error('Failed to parse candidate resume',err);
        return ;
    }
}
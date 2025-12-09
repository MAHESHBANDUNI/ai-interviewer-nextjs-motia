import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'GenerateResumeProfile',
    type : 'event',
    description: 'Generates resume profile in the background',
    subscribes: ['generate.resume.profile'],
    emits: [],
    flows: ['candidate-onboarding-flow']
}

export const handler = async(input, context) => {
    const { emit, logger, state } = context || {};
    let arrayBuffer, candidateId;
    try{
        const result = AdminService.parseCandidateResume({candidateId, arrayBuffer});
        if(!result.success){
            logger.error('Failed to parse candidate resume');
            throw new Error('Failed to parse candidate resume',{status: 400})
        }
        if(result.success){
          logger.info('Candidate resume parsed successfully')
          return ;
        }
    }
    catch(err){
        logger.error('Failed to parse candidate resume',err);
        if(!arrayBuffer || !candidateId){
          logger.error('Failed to parse candidate resume. Missing fields.');
          return ;
        }

        return ;
    }
}
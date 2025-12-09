import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'SendScheduledInterviewMail',
    type : 'event',
    subscribes: ['schedule.interview.mail'],
    emits: [],
    flows: ['interview-scheduling-flow']
}

export const handler = async(input, context) => {
    const { emit, logger } = context || {};
    const {mailDetails} = input;
    try{
        const result = AdminService.sendScheduledInterviewMail({mailDetails});
        if(!result.success){
            logger.error('Failed to send scheduled interview mail');
            throw new Error('Failed to send scheduled interview mail',{status: 400})
        }
        if(result.success){
          logger.info('Scheduled interview email sent successfully')
        }
    }
    catch(err){
        logger.error('Failed to sent scheduled interview mail',err);
        if(!mailDetails){
          logger.error('Failed to sent scheduled interview mail. Missing fields.');
        }
    }
}
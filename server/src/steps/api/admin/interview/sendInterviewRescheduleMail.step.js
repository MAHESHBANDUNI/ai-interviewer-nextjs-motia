import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'SendRescheduledInterviewMail',
    type : 'event',
    subscribes: ['reschedule.interview.mail'],
    emits: [],
    flows: ['interview-rescheduling-flow']
}

export const handler = async(input, context) => {
    const { emit, logger } = context || {};
    const {mailDetails} = input;
    try{
        const result = AdminService.sendRescheduledInterviewMail({mailDetails});
        if(!result.success){
            logger.error('Failed to send rescheduled interview mail');
            throw new Error('Failed to send rescheduled interview mail',{status: 400})
        }
        if(result.success){
          logger.info('Rescheduled interview email sent successfully')
        }
    }
    catch(err){
        logger.error('Failed to sent rescheduled interview mail',err);
        if(!mailDetails){
          logger.error('Failed to sent rescheduled interview mail. Missing fields.');
        }
    }
}
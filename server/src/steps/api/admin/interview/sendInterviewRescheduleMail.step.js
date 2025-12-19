import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'

export const config = {
    name: 'SendRescheduledInterviewMail',
    type : 'event',
    subscribes: ['reschedule-interview-mail'],
    emits: [],
    flows: ['interview-rescheduling-flow']
}

export const handler = async(input, context) => {
    const { emit, logger } = context || {};
    try{
        logger.info('Processing send rescheduled interview mail request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const {mailDetails} = input;
        const result = await AdminService.sendRescheduledInterviewMail(mailDetails, logger);
        if(!result.success){
            logger.error('Failed to send rescheduled interview mail');
            throw new Error('Failed to send rescheduled interview mail',{status: 400})
        }
        if(result.success){
          logger.info('Rescheduled interview email sent successfully')
        }
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to send interview mail', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
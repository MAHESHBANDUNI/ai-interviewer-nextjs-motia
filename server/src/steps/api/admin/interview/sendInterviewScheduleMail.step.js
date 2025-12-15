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
    try{
        logger.info('Processing send scheduled interview mail request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const {mailDetails} = input;
        const result = await AdminService.sendScheduledInterviewMail(mailDetails);
        if(!result.success){
            logger.error('Failed to send scheduled interview mail');
        }
        if(result.success){
          logger.info('Scheduled interview email sent successfully')
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
import { CronService } from "../../../services/cron/cron.service"

export const config = {
  type: 'cron',
  name: 'CancelPendingRescheduledInterviews',
  description: 'Cancel pending/rescheduled interviews',
  cron: '0 0 * * *',
  emits: [],
  flows: []
}

export const handler = async({emit, logger}) =>{
  try{
    const result = await CronService.cancelPendingRescheduledInterview();
    if(!result){
      logger.error('Failed to cancel pending/rescheduled interviews');
    }
    logger.info(`Cancelled ${result?.length} pending/rescheduled interviews successfully`)
  }
  catch(error){
    logger.error('Failed to cancel pending/rescheduled interviews. Error: ',error);
  }
}
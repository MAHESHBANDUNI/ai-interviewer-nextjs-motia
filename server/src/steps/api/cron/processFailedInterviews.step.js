import { CronService } from "../../../services/cron/cron.service"

export const config = {
  type: 'cron',
  name: 'ProcessFailedInterviews',
  description: 'Process failed interviews',
  cron: '0 0 * * *',
  emits: [],
  flows: []
}

export const handler = async({emit, logger}) =>{
  try{
    const result = await CronService.processFailedInterviews();
    if(!result){
      logger.error('Failed to process failed interviews');
    }
    logger.info(`Processed ${result?.length} failed interviews successfully`)
  }
  catch(error){
    logger.error('Failed to process failed interviews. Error: ',error);
  }
}
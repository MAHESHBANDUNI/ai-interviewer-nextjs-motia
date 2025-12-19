import { corsMiddleware } from "../../../middlewares/cors.middleware";
import { errorHandlerMiddleware } from "../../../middlewares/errorHandler.middleware";
import { CandidateService } from "../../../services/candidate/candidate.service";

export const config = {
    name: 'GetTTSAudio',
    type: 'api',
    path: '/api/tts/audio',
    method: 'POST',
    description: 'Get TTS audio endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware]
}

export const handler = async (req,{emit, logger}) => {
    try{
        logger.info('Processing get TTS audio request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp : new Date().toISOString() })
        const text = req?.body?.text;
        const result = await CandidateService.getTTSAudio(text, logger);
        if(!result){
            logger.error('Failed to get TTS Audio');
            throw new Error('Failed to get TTS Audio',{status: 400})
        }
        return {
          status: 200,
          body: result?.audioBuffer,
          headers: {
            "Content-Type": result?.contentType,
            "Content-Disposition": result?.contentDisposition,
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to get TTS Audio', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
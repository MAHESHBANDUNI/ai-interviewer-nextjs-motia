import { authMiddleware } from "../../../middlewares/auth.middleware";
import { errorHandlerMiddleware } from "../../../middlewares/errorHandler.middleware";
import { CandidateService } from "../../../services/candidate/candidate.service";

export const config = {
    name: 'GetAssemblyAIToken',
    type: 'api',
    path: '/api/assemblyai/token',
    method: 'GET',
    description: 'Get AssemblyAI token endpoint',
    emits: [],
    flows: [],
    middleware: [errorHandlerMiddleware, authMiddleware]
}

export const handler = async (req,{emit, logger}) => {
    try{
        logger.info('Processing get TTS audio request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp : new Date().toISOString() })
        const userId = await req?.user?.userId;
        const text = req?.body;
        const result = await CandidateService.getTTSAudio({userId, text});
        if(!result){
            logger.error('Failed to get TTS Audio');
            throw new Error('Failed to get TTS Audio',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'TTS Audio retrieved successfully',
            audioBuffer: result.audioBuffer
          },
          headers: {
            "Content-Type": result.contentType,
            "Content-Disposition": result.contentDisposition,
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
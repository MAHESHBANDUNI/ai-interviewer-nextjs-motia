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
    middleware: [errorHandlerMiddleware]
}

export const handler = async (req,{emit, logger}) => {
    try{
        logger.info('Processing get AssemblyAI token request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp : new Date().toISOString() })
        const result = await CandidateService.getAssemblyAIToken();
        if(!result){
            logger.error('Failed to get AssemblyAI token');
            throw new Error('Failed to get AssemblyAI token',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'AssemblyAI token retrieved successfully',
            token: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to get AssemblyAI token', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
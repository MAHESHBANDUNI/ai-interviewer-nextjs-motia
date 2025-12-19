import { z } from 'zod';
import { AuthService } from '../../../services/auth/auth.service';
import { corsMiddleware } from '../../../middlewares/cors.middleware';
import { errorHandlerMiddleware } from '../../../middlewares/errorHandler.middleware';

export const config = {
  name: 'UserLogin',
  type: 'api',
  path: '/api/auth/signin',
  method: 'POST',
  description: 'User signin endpoint',
  emits: [],
  middleware: [corsMiddleware, errorHandlerMiddleware],
};

export const handler = async (req, { emit, logger }) => {
  try{
  logger.info('Processing user signin request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
  
  const email = req?.body?.email;
  const password= req?.body?.password;
  if (!email || !password){
    logger.error('Missing fields');
    return {
      status: 400,
      body: {
        error: 'Missing fields'
      }
    }
  }
  const result = await AuthService.signin(email, password);
  
  return {
    status: 200,
    body: {
      message: 'User signin successfully',
      user: result
    }
  };
  }
  catch (error) {
    if (logger) {
      logger.error('Failed in user signin', { error: error.message });
    }
    return {
      status: 500,
      body: {
        error: 'Internal server error'
      }
    };
  }
};

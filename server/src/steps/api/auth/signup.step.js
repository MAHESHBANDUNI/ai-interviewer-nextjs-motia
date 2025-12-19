import { z } from 'zod';
import { AuthService } from '../../../services/auth/auth.service';
import { corsMiddleware } from '../../../middlewares/cors.middleware';
import { errorHandlerMiddleware } from '../../../middlewares/errorHandler.middleware';

export const config = {
  name: 'UserSignup',
  type: 'api',
  path: '/api/auth/signup',
  method: 'POST',
  description: 'User signup endpoint',
  emits: [],
  middleware: [corsMiddleware, errorHandlerMiddleware],
};

export const handler = async (req, { emit, logger }) => {
  try{
  
  logger.info('Processing user signup request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
  
  const { email, password, firstName, lastName, phone } = req.body || {};
  if(!email || !password || !firstName || !lastName){
    return {
      status: 400,
      body: {
        error: 'Missing fields'
      }
    }
  }
  const result = await AuthService.signup(email, password);
  
  return {
    status: 201,
    body: {
      message: 'User signup successfully',
      user: result
    }
  };
  }
  catch(err){
    logger.error('Failed in user signup',err);
    return {
      status: 500,
      body: {
        message: 'User signup failed'
      }
  };
  }
};

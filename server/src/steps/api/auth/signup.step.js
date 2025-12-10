import { z } from 'zod';
import { AuthService } from '../../../services/auth/auth.service';

export const config = {
  name: 'UserSignup',
  type: 'api',
  path: '/api/auth/signup',
  method: 'POST',
  description: 'User signup endpoint',
  emits: [],
  flows: []
};

export const handler = async (req, { emit, logger }) => {
  try{
  const appName = process.env.APP_NAME || 'AI-Interviewer';
  const timestamp = new Date().toISOString();
  
  logger.info('User signup attempted', { appName, timestamp });
  
  const { email, password, firstName, lastName, phone } = req.body || {};
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

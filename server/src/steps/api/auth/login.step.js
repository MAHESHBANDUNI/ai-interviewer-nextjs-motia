import { z } from 'zod';
import { AuthService } from '../../../services/auth/auth.service';

export const config = {
  name: 'UserLogin',
  type: 'api',
  path: '/api/auth/signin',
  method: 'POST',
  description: 'User signin endpoint',
  emits: [],
  flows: [],
  // responseSchema: {
  //   200: z.object({
  //     message: z.string(),
  //     user: z.object()
  //   })
  // }
};

export const handler = async (req, { emit, logger }) => {
  try{
  logger.info('User signin attempted', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
  
  const {email, password} = req.body || {};
  const result = await AuthService.login(email, password);
  
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

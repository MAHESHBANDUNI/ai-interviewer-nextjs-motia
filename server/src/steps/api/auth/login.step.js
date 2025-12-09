import { z } from 'zod';
import { AuthService } from '../../../services/auth/auth.service';

export const config = {
  name: 'UserLogin',
  type: 'api',
  path: '/auth/signin',
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
  const appName = process.env.APP_NAME || 'AI-Interviewer';
  const timestamp = new Date().toISOString();
  
  logger.info('User signin attempted', { appName, timestamp });
  
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
  catch(err){
    logger.error('Failed in user signin',err);
    return {
      status: 500,
      body: {
        message: 'User signin failed'
      }
  };
  }
};

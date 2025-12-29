import {z} from 'zod';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';
import { corsMiddleware } from '../../../../middlewares/cors.middleware';
import { CandidateService } from '../../../../services/candidate/candidate.service';

export const config = {
    name: 'GetInterviewAnalytics',
    type : 'api',
    path : '/api/candidate/interviews/analytics',
    method: 'GET',
    description: 'Get dashboard analytics endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async (req, { emit, logger, traceId }) => {
  try {
    logger.info('Processing retrieve candidate dashboard analytics request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
    const userId = await req?.user?.userId;
    if (!userId) {
      return {
        status: 401,
        body: { error: "Unauthorized: userId missing" }
      };
    }

    const result = await CandidateService.getInterviewAnalytics(userId);
    if (!result) {
      return {
        status: 400,
        body: { error: 'Failed to get analytics' }
      };
    }

    return {
      status: 200,
      body: {
        message: 'Retrieved analytics successfully',
        analytics: result
      }
    };
  } catch (error) {
    logger?.error("Internal error", error);
    return {
      status: 500,
      body: { error: error?.message || "Internal Server error" }
    };
  }
};

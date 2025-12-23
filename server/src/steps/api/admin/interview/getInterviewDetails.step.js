import { z } from "zod";
import { authMiddleware } from "../../../../middlewares/auth.middleware";
import { errorHandlerMiddleware } from "../../../../middlewares/errorHandler.middleware";
import { corsMiddleware } from "../../../../middlewares/cors.middleware";
import { AdminService } from "../../../../services/admin/admin.service";

export const config = {
    name: 'GetInterviewDetailsByAdmin',
    type : 'api',
    path : '/api/admin/interview/:id',
    method: 'GET',
    description: 'Get interview details for admin endpoint',
    emits: [],
    flows: [],
    middleware: [corsMiddleware, errorHandlerMiddleware, authMiddleware]
}

export const handler = async(req, {emit, logger}) =>{
    try{
        logger.info('Processing get interview details by admin request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const interviewId = await req?.pathParams?.id;
        const userId = await req?.user?.userId;
        if(!interviewId || !userId){
          return {
            status: 400,
            body: {
              error: 'Missing fields'
            }
          }
        }
        const result = await AdminService.getInterviewDetailsByAdmin(interviewId, userId);
        if(!result){
            logger.error('Failed to get interview details by admin');
            throw new Error('Failed to get interview details by admin',{status: 400})
        }
        return {
          status: 200,
          body: {
            message: 'Interview details by admin retrieved successfully',
            data: result
          }
        };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to retrieve interview details by admin', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    }
}
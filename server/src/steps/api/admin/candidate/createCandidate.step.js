import { z } from 'zod';
import { AdminService } from '../../../../services/admin/admin.service';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';

export const config = {
  name: 'CreateCandidate',
  type: 'api',
  path: '/api/admin/candidate/create',
  method: 'POST',
  description: 'Create candidate endpoint',
  emits: ['generate.resume.profile'],
  flows: ['candidate-onboarding-flow'],
  middleware: [errorHandlerMiddleware, authMiddleware]
};

export const handler = async (req, { emit, logger, state }) => {
  try {
    logger.info('Processing create new candidate request', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
    const userId = req?.user?.userId;

    // Extract form fields from request body
    const email = req.body.email || req.body.get?.('email');
    const firstName = req.body.firstName || req.body.get?.('firstName');
    const lastName = req.body.lastName || req.body.get?.('lastName');
    const phoneNumber = req.body.phoneNumber || req.body.get?.('phoneNumber');
    const resumeUrl = req.body.resumeUrl

    // Call the service to create a candidate
    const result = await AdminService.createCandidate({
      email,
      firstName,
      lastName,
      resumeUrl,
      userId,
      phoneNumber
    });

    if (!result) {
      logger.error('Failed to create candidate');
      return {
        status: 400,
        body: { error: 'Failed to create candidate' }
      };
    }

    // Emit event for resume processing if required
    if (emit) {
      await emit({
        topic: 'generate.resume.profile',
        data: {
          candidateId: result?.newCandidate?.candidateId,
          resumeUrl: result?.newCandidate?.resumeUrl,
        }
      });
    }

    return {
      status: 201,
      body: {
        message: 'Candidate created successfully',
        candidate: result,
      }
    };
  } catch (error) {
    if (logger) {
      logger.error('Failed to create candidate', { error: error.message, status: error.status });
    }
    return {
      status: error.status || 500,
      body: { error: error.message || 'Internal server error' }
    };
  }
};

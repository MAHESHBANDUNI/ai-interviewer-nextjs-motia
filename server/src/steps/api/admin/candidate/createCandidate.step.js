import { z } from 'zod';
import { AdminService } from '../../../../services/admin/admin.service';

export const config = {
    name: 'CreateCandidate',
    type: 'api',
    path: '/admin/candidate/create',
    method: 'POST',
    description: 'Create candidate endpoint',
    emits: ['generate.resume.profile'],
    flows: ['candidate-onboarding-flow'],
};

export const handler = async (req, { emit, logger, state }) => {
    try {
        const { email, firstName, lastName, resume } = await req.json();

        const result = await AdminService.createCandidate(
            email,
            firstName,
            lastName,
            resume
        );

        if (!result.ok) {
            logger.error('Failed to create candidate');
            throw new Error('Failed to create candidate');
        }

        if (emit) {
          await emit({
            topic: 'generate.resume.profile',
            data: {
              candidateId: result?.newCandidate?.candidateId,
              arrayBuffer: result?.arrayBuffer,
            }
          });
        }

        return {
            status: 201,
            body: {
                message: 'Candidate created successfully',
                candidate: result,
            },
        };
    } catch (err) {
        logger.error('Failed to create candidate', err);

        return {
            status: 500,
            body: {
                message: 'Internal server error',
            },
        };
    }
};

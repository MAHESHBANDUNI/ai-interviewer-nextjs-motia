import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError.util";

export const CronService = {
    async cancelPendingRescheduledInterview() {
        const cancelledInterviews = await prisma.interview.updateMany({
            where: {
                status: {
                  in: ['PENDING','RESCHEDULED']
                },
            },
            data: {
                status: 'CANCELLED',
                cancellationReason: 'Candidate did not attended'
            }
        });
        return cancelledInterviews;
    },
    async processFailedInterviews() {
        const cancelledInterviews = await prisma.interview.updateMany({
            where: {
                status: 'ONGOING'
            },
            data: {
                status: 'COMPLETED'
            }
        });
        return cancelledInterviews;
    },
};
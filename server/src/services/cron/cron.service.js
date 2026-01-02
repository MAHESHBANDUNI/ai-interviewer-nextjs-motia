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
        const now = Date.now();
    
        const interviews = await prisma.interview.findMany({
            where: {
                status: 'ONGOING'
            }
        });
    
        const expiredIds = interviews
            .filter(i => {
                const endTime =
                    new Date(i.attemptedAt).getTime() +
                    i.durationMin * 60 * 1000;
                return endTime < now;
            })
            .map(i => i.interviewId);
        
        if (!expiredIds.length) return { count: 0 };
        
        return prisma.interview.updateMany({
            where: {
                interviewId: { in: expiredIds }
            },
            data: {
                status: 'COMPLETED'
            }
        });
    }
};
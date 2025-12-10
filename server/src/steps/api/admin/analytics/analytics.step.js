import {z} from 'zod';
import {AdminService} from '../../../../services/admin/admin.service'
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { prisma } from '../../../../lib/prisma';
import { errorHandlerMiddleware } from '../../../../middlewares/errorHandler.middleware';

export const config = {
    name: 'GetAnalytics',
    type : 'api',
    path : '/api/admin/analytics',
    method: 'GET',
    description: 'Get dashboard analytics endpoint',
    emits: [],
    flows: [],
    middleware: [authMiddleware, errorHandlerMiddleware]
}

export const handler = async (req, { emit, logger, traceId }) => {
  try {
    const userId = await req?.user?.userId;
    if (!userId) {
      return {
        status: 401,
        body: { error: "Unauthorized: userId missing" }
      };
    }

    logger.info("user",userId);

    // const result = await AdminService.getAnalytics(userId, logger);
    const admin = await prisma.user.findFirst({
      where:{
        userId
      }
    })
    if(!admin){
      return {
        status: 401,
        body: { error: "Not authorised"}
      };
    }
    logger.info("admin",admin);
    const candidatesCount = await prisma.candidate.count();
    const interviewsCount = await prisma.interview.count();

    const completedInterviews = await prisma.interview.findMany({
        where: { status: 'COMPLETED' },
        select: {
            completionMin: true,
            durationMin: true,
        }
    })
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
        
    const thisWeekCandidateCount = await prisma.candidate.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
          lte: now,
        },
      },
    })
    const thisWeekInterviewCount = await prisma.interview.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
          lte: now,
        },
      },
    })
    // Total completed interview minutes (actual time)
    const totalCompletionMins = completedInterviews.reduce(
        (sum, i) => sum + (i.completionMin || 0),
        0
    );

    // Total planned interview durations
    const totalScheduledMins = completedInterviews.reduce(
        (sum, i) => sum + (i.durationMin || 0),
        0
    );

    // Average actual duration
    const avgCompletionMins =
        completedInterviews.length > 0
            ? (totalCompletionMins / completedInterviews.length).toFixed(2)
            : 0;

    // Average planned duration
    const avgScheduledMins =
        completedInterviews.length > 0
            ? (totalScheduledMins / completedInterviews.length).toFixed(2)
            : 0;

    // Completion rate = actual / scheduled
    const completionRate =
        totalScheduledMins > 0
            ? ((totalCompletionMins / totalScheduledMins) * 100).toFixed(1)
            : "0"
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    
    const results = await prisma.resumeProfile.groupBy({
      by: ["jobAreaId"],
      where: {
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth
        }
      },
      _count: {
        jobAreaId: true
      },
      orderBy: {
        _count: {
          jobAreaId: "desc"
        }
      },
      take: 5
    });
    // console.log('Results',results);

    const populated = await Promise.all(
      results.map(async (area) => {
        const jobArea = await prisma.jobAreas.findUnique({
          where: { jobAreaId: area.jobAreaId}
        })
        const interviewCount = await prisma.interview.count({
            where:{
                createdAt: {
                  gte: startOfMonth,
                  lt: endOfMonth
                },
                candidate:{
                    resumeProfile:{
                        jobAreaId: jobArea?.jobAreaId
                    }
                }
            }
        })
    
        return {
          jobAreaId: area.jobAreaId,
          name: jobArea?.name || "Unknown",
          count: interviewCount
        };
      })
    )
    const interviewCount = await prisma.interview.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth
        }
      }
    });

    const result = {
        candidatesCount,
        thisWeekCandidateCount,
        interviewsCount,
        thisWeekInterviewCount,
        completionRate: Number(completionRate),
        avgCompletionMins,
        avgScheduledMins,
        topJobAreas: populated,
        totalInterviewsThisMonth: interviewCount
    };

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

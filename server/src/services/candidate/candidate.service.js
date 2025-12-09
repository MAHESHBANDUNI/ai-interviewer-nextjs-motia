import { prisma } from "../../lib/prisma";

export const CandidateService = {
    async getCandidateDetails(candidateId){
        const candidate = await prisma.candidate.findFirst({
          where:{
            candidateId: candidateId
          },
          include: {
            resumeProfile: {
              include: {
                jobArea: true
              }
            },
          }
        });
        if(!candidate){
            throw new Error('Candidate not found',{status: 404});
        }
        return candidate;
    },
    async getInterviewDetails({interviewId, candidateId}){
        const interview = await prisma.interview.findFirst({
          where: {
            interviewId,
            candidateId
          },
          select: {
            interviewId: true,
            durationMin: true,
            candidate: {
              select:{
                candidateId: true,
                firstName: true,
                lastName: true
              }
            },
            admin: {
              select:{
                firstName: true,
                lastName: true
              }
            }
          }
        });
        if(!interview){
            throw new Error({error: 'Interview not found'}, {status: 400});
        }
        return interview;
    },
    async getCandidateAllInterviews({candidateId, interviewId}){
        const interviews = await prisma.interview.findMany({
            where: {
              candidateId,
              ...(interviewId && { interviewId })
            },
            select: {
                interviewId: true,
                scheduledAt: true,
                durationMin: true,
                status: true,
                cancelledAt: true,
                cancellationReason: true,
                candidate: {
                  select:{
                    candidateId: true,
                    firstName: true,
                    lastName: true
                  }
                },
                interviewProfile: {
                  select:{
                    performanceScore: true,
                    analytics: true,
                    recommendedRoles: true,
                    strengths: true,
                    weaknesses: true
                  }
                },
                questions: {
                  select:{
                    content: true,
                    candidateAnswer: true,
                    aiFeedback: true,
                    difficultyLevel: true,
                    correct: true
                  }
                },
                admin: {
                    select:{
                        firstName: true,
                        lastName: true
                    }
                }
            }
        })
        if (!interviews) {
            return NextResponse.json({ error: "Interviews not found" }, { status: 404 });
        }
        return interviews;
    }
}
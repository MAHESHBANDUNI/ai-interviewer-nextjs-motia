import { prisma } from "../../lib/prisma";
import { UploadResume } from "../../utils/backblaze.util";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendScheduledInterviewMail, sendRescheduledInterviewMail } from "../../utils/email.util";
import { ApiError } from "../../utils/apiError.util";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const formatDate = (dateString) => {
  const date = new Date(dateString);
  
  const day = date.getDate();
  const daySuffix = (d => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  })(day);
  const options = { month: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
  const formattedDateParts = date.toLocaleString('en-US', options).split(' ');
  const formattedDate = `${formattedDateParts[0]} ${day}${daySuffix}, ${date.getFullYear()}, ${formattedDateParts[2]} ${formattedDateParts[3]}`;
  return formattedDate;
}

export const AdminService = {

  async getAnalytics (userId) {
    const admin = await prisma.user.findFirst({
      where:{
        userId: userId,
        roleId: 1
      }
    })
    if(!admin){
      throw new ApiError(401,'Not authorised');
    }
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
          where: { jobAreaId: area.jobAreaId || "" }
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

    return {
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
  },

  async createCandidate(email, firstName, lastName, resume) {
    const customUUID = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(`${firstName}@123`, 10);

    const {arrayBuffer, fileUrl} = await UploadResume(resume);

    const user = await prisma.user.create({
      data:{
        userId: customUUID,
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone: phoneNumber,
        roleId: 2
      }
    })

    const newCandidate = await prisma.candidate.create({
      data: {
        candidateId: user.userId,
        email,
        firstName,
        lastName,
        status: "NEW",
        phone: phoneNumber,
        resumeUrl: fileUrl,
        adminId: adminId
      }
    });
    return {newCandidate, arrayBuffer};
  },

  async getAllCandidates(userId) {
    const admin = await prisma.user.findFirst({
      where:{
        userId: userId,
        roleId: 1
      }
    })
    if(!admin){
      // throw new Error({error: 'Interview not found'}, {code: 400});
      throw { message: 'Interview not found', status: 400 };
    }
    const candidates = await prisma.candidate.findMany({});
    if(candidates.length < 1){
      throw { message: 'Candidate not found', status: 400 };
      // throw new Error({error: 'Candidate not found'}, {code: 404});
    }
    return candidates;
  },

  async deleteCandidate(candidateId, userId) {
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        candidateId: candidateId
      }
    })

    if(!existingCandidate){
      throw new ApiError('Candidate not found',404);
    }

    await prisma.interviewQuestion.deleteMany({
      where: { interview: { candidateId } }
    });

    await prisma.interviewProfile.deleteMany({
      where: { candidateId }
    });

    await prisma.interview.deleteMany({
      where: { candidateId }
    });

    await prisma.resumeProfile.deleteMany({
      where: { candidateId }
    });

    const deletedCandidate = await prisma.candidate.delete({
      where: { candidateId }
    });

    const deletedUser = await prisma.user.delete({
      where: { userId: candidateId }
    });

    return deletedCandidate;
  },

  async getCandidateInterviews(candidateId, adminId, interviewId) {
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        candidateId: candidateId
      }
    })

    if(!existingCandidate){
      throw new ApiError('Candidate not found',404);
    }

    const interviews = await prisma.interview.findMany({
        where: {
          candidateId,
          ...(interviewId && { interviewId }),
          status: 'COMPLETED'
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

    if(!interviews){
      throw new ApiError('Candidate interviews profile not found.',404)
    }
    return interviews;
  },

  async getCandidateResumeProfile(candidateId) {
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        candidateId: candidateId
      }
    })

    if(!existingCandidate){
      throw new ApiError('Candidate not found',404);
    }

    const candidateResumeProfile = await prisma.resumeProfile.findFirst({
      where: {
        candidateId: candidateId
      },
      select: {
        profileTitle: true,
        certifications: true,
        experienceSummary: true,
        educationSummary: true,
        technicalSkills: true,
        otherSkills: true,
        projects: true,
        candidate: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if(!candidateResumeProfile){
      throw new ApiError('Candidate resume profile not found',404);
    }

    return candidateResumeProfile;
  },

  async parseCandidateResume ({candidateId, arrayBuffer}) {
    const buffer = Buffer.from(arrayBuffer);

    // Extract resume text
    const resumeText = async () => {
      const blob = new Blob([buffer], { type: "application/pdf" });
      const loader = new PDFLoader(blob, { splitPages: false });
      const docs = await loader.load();
      return docs.map((d) => d.pageContent).join("\n\n");
    };

    // Get job areas from DB
    const jobAreas = await prisma.jobAreas.findMany({
      select: { name: true },
    });
    
    const jobAreaNames = jobAreas.map(j => j.name);

    // Gemini resume parsing
    const structured = async () => {
      const prompt = `
You are an expert resume parser. Your task is to convert the resume text into a clean, strictly valid JSON object that follows the exact structure and naming of the provided Prisma model.

========================================
PRISMA MODEL (RETURN JSON MUST MATCH)
========================================
{
  "profileTitle": String?,
  "jobAreaId": String,
  "technicalSkills": Json?,
  "otherSkills": Json?,
  "experienceSummary": [
    {
      "dates": String,
      "title": String,
      "company": String,
      "location": String,
      "responsibilities": Array<String>
    }
  ],
  "educationSummary": String?,
  "certifications": Json?,
  "projects": [
    {
      "name": String,
      "description": Array<String>
    }
  ]
}

========================================
STRICT OUTPUT RULES
========================================
1. OUTPUT MUST BE ONLY valid JSON — no Markdown, no comments.
2. DO NOT wrap output inside \`\`\`json or any code fences.
3. DO NOT hallucinate — if missing, return null or [].
4. Do not include fields not defined in the model.
5. Output must be valid JSON with no trailing commas.
6. technicalSkills must be classified into categories (e.g., Frontend, Backend, Database, DevOps & Cloud etc.) and each category must contain short technology names only.
7. Select jobAreaId based on the closest matching job area from the provided job area list.

========================================
INPUT RESUME
========================================
"""${resumeText}"""

INPUT LIST OF JOB AREAS
========================================
"""${JSON.stringify(jobAreaNames)}"""

========================================
TASK
========================================
Return ONLY the final JSON object.
`;

      const result = await geminiModel.generateContent(prompt);
      let output = result.response.text().trim();

      // Cleanup formatting issues
      output = output
        .replace(/```json/i, "")
        .replace(/```/g, "")
        .trim();

      // Parse JSON safely
      try {
        return JSON.parse(output);
      } catch (err) {
        console.ApiError("Gemini returned invalid JSON:", output);

        const cleaned = output
          .replace(/\n/g, " ")
          .replace(/\t/g, " ")
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]");

        try {
          return JSON.parse(cleaned);
        } catch (err2) {
          throw new ApiError("Gemini output was not valid JSON",400);
        }
      }
    };

    const jobArea = await prisma.jobAreas.findFirst({
      where: {
        name: {
          contains: structured.jobAreaId,
          mode: 'insensitive',
        },
      },
    });

    await prisma.resumeProfile.create({
      data: {
        candidateId,
        jobAreaId: jobArea.jobAreaId,
        profileTitle: toTitleCase(structured.profileTitle),
        technicalSkills: structured.technicalSkills,
        otherSkills: structured.otherSkills,
        experienceSummary: structured.experienceSummary,
        educationSummary: structured.educationSummary,
        certifications: structured.certifications,
        projects: structured.projects,
      },
    });

    return { success: true, parsed: structured };
  },

  async getAllInterviews(userId) {
    const admin = await prisma.user.findFirst({
      where:{
        userId: userId,
        roleId: 1
      }
    })
    if(!admin){
      throw new ApiError('Not authorised',401);
    }
    const interviews = await prisma.interview.findMany({
      include: {
        candidate: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    if(interviews.length < 1){
      throw new ApiError('No interview found.',404)
    }
    return interviews;
  },

  async scheduleInterview({datetime, duration, candidateId, adminId}){
    if( !candidateId || !datetime || !duration){
        throw new ApiError("Missing fields",400);
    }

    const candidate = await prisma.candidate.findFirst({
        where: {
            candidateId: candidateId
        }
    })

    const interview = await prisma.interview.create({
      data:{
        candidateId: candidateId,
        scheduledAt: datetime,
        durationMin: Number(duration),
        adminId: adminId,
        status: 'PENDING'
      }
    })

    const updatedCandidate = await prisma.candidate.update({
      where:{
          candidateId: interview.candidateId
      },
      data: {
        status: "INTERVIEW_SCHEDULED",
      }
    });

    const mailDetails = {
      candidateEmail: candidate.email,
      candidateName: candidate.firstName+' '+candidate.lastName,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signin`,
      candidatePassword: `${candidate.firstName}@123`,
      meetingTime: formatDate(interview.scheduledAt)
    }
    return mailDetails;
  },

  async sendScheduledInterviewMail({mailDetails}){
    if(!mailDetails){
      throw new ApiError('Missing mail details',400)
    }
    const response = await sendScheduledInterviewMail({mailDetails});
    return response;
  },

  async rescheduleInterview({candidateId, adminId, interviewId, newDatetime, oldDatetime, duration}){
    if( !candidateId || !newDatetime || !duration){
        throw new ApiError('Missing fields',400)
    }

    const candidate = await prisma.candidate.findFirst({
        where: {
            candidateId: candidateId
        }
    })

    const updatedInterview = await prisma.interview.update({
        where:{
            candidateId: candidateId,
            interviewId: interviewId
        },
      data:{
        scheduledAt: newDatetime,
        durationMin: Number(duration),
        status: 'RESCHEDULED'
      }
    })

    const mailDetails = {
      candidateEmail: candidate.email,
      candidateName: candidate.firstName+' '+candidate.lastName,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signin`,
      candidatePassword: `${candidate.firstName}@123`,
      meetingTime: formatDate(updatedInterview.scheduledAt),
      oldMeetingTime: formatDate(oldDatetime)
    }
    return mailDetails;
  },

  async sendRescheduledInterviewMail({mailDetails}){
    if(!mailDetails){
      throw new ApiError('Missing mail details',400)
    }
    const response = await sendRescheduledInterviewMail({mailDetails});
    return response;
  },

  async cancelInterview(interviewId, cancellationReason){
    const existingInterview = await prisma.interview.findFirst({
      where: {
        interviewId: interviewId
      }
    })

    if(!existingInterview){
      throw new ApiError('Interview not found',404);
    }
    const interview = await prisma.interview.update({
      where: {
        interviewId: interviewId
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: cancellationReason || "Interviewer unavailable due to emergency"
      }
    });

    return interview;
  }
};

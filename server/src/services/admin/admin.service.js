import { prisma } from "../../lib/prisma";
import { UploadResume, ViewResume, getSignedUrl } from "../../utils/backblaze.util";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendScheduledInterviewMail, sendRescheduledInterviewMail } from "../../utils/email.util";
import { ApiError } from "../../utils/apiError.util";
import bcrypt from 'bcrypt';
import socketTokenGeneration from "../../utils/socketToken.util";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY1);

const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
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

  async checkAdminAuth(userId){
    const admin = await prisma.user.findFirst({
      where:{
        userId: userId,
        roleId: 1
      }
    })
    if(!admin){
      throw new ApiError(401,'Not authorised');
    }
    return true;
  },

  async getAnalytics ({userId}) {
    await this.checkAdminAuth(userId);
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

  async uploadCandidateResume({fileBuffer, filename, mimetype}) {
    const result = await UploadResume(fileBuffer, filename, mimetype);
    return result;
  },

  async createCandidate({email, firstName, lastName, resumeUrl, phoneNumber, userId}) {
    await this.checkAdminAuth(userId);
    const customUUID = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(`${firstName}@123`, 10);

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
        resumeUrl: resumeUrl,
        adminId: userId
      }
    });
    return {newCandidate};
  },

  async getAllCandidates({userId}) {
    await this.checkAdminAuth(userId);
    const candidates = await prisma.candidate.findMany({
      include: {
        resumeProfile: {
          include: {
            jobArea: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    if(candidates.length < 1){
      throw new ApiError(400, 'Candidate not found');
    }
    return candidates;
  },

  async deleteCandidate({candidateId, userId}) {
    await this.checkAdminAuth(userId);
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

  async getCandidateInterviews({candidateId, userId, interviewId}) {
    await this.checkAdminAuth(userId);

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
        },
        orderBy: {
          scheduledAt: 'desc'
        }
    })

    if(!interviews || interviews.length < 1){
      throw new ApiError('Candidate interviews profile not found.',404)
    }
    return interviews;
  },

  async getCandidateResume(fileName){
    const result = await ViewResume(fileName);
    return result;
  },

  async getCandidateResumeProfile({candidateId, userId}) {
    await this.checkAdminAuth(userId);
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        candidateId: candidateId
      }
    })

    if(!existingCandidate){
      throw new ApiError(404,'Candidate not found');
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

  async parseCandidateResume({ candidateId, resumeUrl }) {
    function getFilenameFromUrl(url) {
      const parts = url.split('/');
      return parts.pop() || parts.pop();
    }

    try {
      const fileName = `documents/${getFilenameFromUrl(resumeUrl)}`;
      const signedResumeUrl = await getSignedUrl({ fileName });

      const response = await fetch(signedResumeUrl);
      if (!response.ok) throw new ApiError("Failed to download resume", 400);

      const buffer = Buffer.from(await response.arrayBuffer());

      /** ------------ EXTRACT PDF TEXT ------------ **/
      const getResumeText = async () => {
        const blob = new Blob([buffer], { type: "application/pdf" });
        const loader = new PDFLoader(blob, { splitPages: false });
        const docs = await loader.load();
        return docs.map((d) => d.pageContent).join("\n\n");
      };

      const resumeText = await getResumeText();

      /** ------------ FETCH JOB AREAS ------------ **/
      const jobAreas = await prisma.jobAreas.findMany({ select: { name: true } });
      const jobAreaNames = jobAreas.map((x) => x.name);

      /** ------------ GEMINI STRUCTURED PARSING ------------ **/
      const getStructured = async () => {
        const prompt = `
  You are an expert resume parser. Convert the resume into valid JSON strict to this model:

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
    "certifications": Array<String>?,
    "projects": [
      {
        "name": String,
        "description": Array<String>
      }
    ]
  }

  Rules:
  1. Output ONLY JSON. No markdown. No extra text.
  2. Missing values → null or [].
  3. technicalSkills must be technology-only lists grouped by category.
  4. jobAreaId must be selected by best match from this list:
  ${JSON.stringify(jobAreaNames)}

  RESUME CONTENT:
  """${resumeText}"""
  `;

        const result = await geminiModel.generateContent(prompt);
        let output = result.response.text().trim();

        output = output
          .replace(/```json/i, "")
          .replace(/```/g, "")
          .trim();

        try {
          return JSON.parse(output);
        } catch (err) {

          const cleaned = output
            .replace(/\n/g, " ")
            .replace(/\t/g, " ")
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]");

          return JSON.parse(cleaned);
        }
      };

      const structured = await getStructured();

      if (!structured) {
        throw new ApiError("Gemini returned empty structured output", 400);
      }

      /** ------------ MATCH JOB AREA FROM STRUCTURE ------------ **/
      const matchedJobArea = await prisma.jobAreas.findFirst({
        where: {
          name: {
            contains: structured.jobAreaId || "",
            mode: "insensitive"
          }
        }
      });

      if (!matchedJobArea) {
        throw new ApiError("Invalid or unmatched jobAreaId from parsed resume", 400);
      }

      /** ------------ INSERT INTO DATABASE ------------ **/
      const savedProfile = await prisma.resumeProfile.create({
        data: {
          candidateId,
          jobAreaId: matchedJobArea.jobAreaId,
          profileTitle: structured.profileTitle || null,
          technicalSkills: structured.technicalSkills || null,
          otherSkills: structured.otherSkills || null,
          experienceSummary: structured.experienceSummary || [],
          educationSummary: structured.educationSummary || null,
          certifications: structured.certifications || null,
          projects: structured.projects || []
        }
      });
      return { success: true, resumeProfile: savedProfile };

    } catch (error) {
      throw new ApiError(400, `Failed to parse resume: ${error}`);
    }
  },

  async getAllInterviews({userId}) {
    await this.checkAdminAuth(userId);
    const interviews = await prisma.interview.findMany({
      include: {
        candidate: {
          include: {
            resumeProfile: {
              include: {
                jobArea: true
              }
            }
          }
        }
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

  async getInterviewDetailsByAdmin(interviewId, userId){
      const admin = await prisma.admin.findFirst({
        where: {
          adminId: userId
        },
        include:{
            user: {
              include: {
                role: true
              }
            }
        }
      });
      const interview = await prisma.interview.findFirst({
        where: {
          interviewId,
          adminId: userId
        },
        select: {
          interviewId: true,
          durationMin: true,
          status: true,
          candidate: {
            select:{
              candidateId: true,
              firstName: true,
              lastName: true,
              resumeProfile: {
                select:{
                  profileTitle: true
                }
              }
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
          throw new ApiError('Interview not found',400);
      }
      
      const interviewSessionToken = await socketTokenGeneration({ interviewId: interview?.interviewId, durationMin: interview?.durationMin, userId: userId, role: admin?.user?.role?.roleName })
      return {interview: interview, interviewSessionToken: interviewSessionToken};
  },

  async scheduleInterview({datetime, duration, candidateId, userId}){
    await this.checkAdminAuth(userId);
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
        adminId: userId,
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
      loginUrl: `${process.env.CLIENT_SERVER_URL}/auth/signin`,
      candidatePassword: `${candidate.firstName}@123`,
      meetingTime: formatDate(interview.scheduledAt)
    }
    return mailDetails;
  },

  async sendScheduledInterviewMail(mailDetails){
    try{
      if(!mailDetails){
        throw new ApiError('Missing mail details',400)
      }
      const response = await sendScheduledInterviewMail(mailDetails);
      return response;
    }
    catch(error){
      throw new ApiError(400, `${error}`)
    }
  },

  async rescheduleInterview({candidateId, userId, interviewId, newDatetime, oldDatetime, duration}){
    await this.checkAdminAuth(userId);
    if( !candidateId || !newDatetime || !duration || !interviewId || !oldDatetime){
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
      loginUrl: `${process.env.CLIENT_SERVER_URL}/auth/signin`,
      meetingTime: formatDate(updatedInterview.scheduledAt),
      oldMeetingTime: formatDate(oldDatetime)
    }
    return mailDetails;
  },

  async sendRescheduledInterviewMail(mailDetails){
    try{
      if(!mailDetails){
        throw new ApiError('Missing mail details',400)
      }
      const response = await sendRescheduledInterviewMail(mailDetails);
      return response;
    }
    catch(error){
      throw new ApiError(400, `${error}`)
    }
  },

  async cancelInterview({interviewId, userId, cancellationReason}){
    await this.checkAdminAuth(userId);
    const existingInterview = await prisma.interview.findFirst({
      where: {
        interviewId: interviewId,
        status: {in: ['PENDING','RESCHEDULED']}
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

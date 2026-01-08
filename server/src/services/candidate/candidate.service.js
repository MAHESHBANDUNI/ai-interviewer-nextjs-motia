import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError.util";
import { callGemini } from "../../utils/gemini.util";
import { roomService } from "../../utils/livekit.util";
import socketTokenGeneration from "../../utils/socketToken.util";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AccessToken } from "livekit-server-sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

export const CandidateService = {
    async checkCandidateAuth(userId){
      const candidate = await prisma.user.findFirst({
        where:{
          userId: userId,
          roleId: 2
        }
      })
      if(!candidate){
        throw new ApiError(401,'Not authorised');
      }
      
      return candidate;
    },

    async checkInterviewDetails(userId, interviewId){
        const interview = await prisma.interview.findFirst({
          where: {
            interviewId,
            candidateId: userId,
            status: {
              in: ['PENDING', 'RESCHEDULED','ONGOING'],
            },
          },
        });

        if(!interview){
          throw new ApiError(400,'Failed to start interview session');
        }

        return interview;
    },

    async getInterviewAnalytics(userId){
      this.checkCandidateAuth(userId);
        const allInterviews = await prisma.interview.findMany({
          where: {
            candidateId: userId
          },
          select: {
            status: true
          }
        })
        const upcomingInterview = allInterviews.filter(interview => interview.status === 'PENDING' || interview.status === 'RESCHEDULED');
        const completedInterview = allInterviews.filter(interview => interview.status === 'COMPLETED');
        const cancelledInterview = allInterviews.filter(interview => interview.status === 'CANCELLED');
        return {allInterviewsCount: allInterviews.length, upcomingInterviewCount : upcomingInterview.length, completedInterviewCount: completedInterview.length, cancelledInterviewCount: cancelledInterview.length};
    },

    async getCandidateDetails(userId){
        await this.checkCandidateAuth(userId);
        const candidateDetails = await prisma.candidate.findFirst({
          where:{
            candidateId: userId
          },
          include: {
            resumeProfile: {
              include: {
                jobArea: true
              }
            },
          }
        });
        if(!candidateDetails){
            throw new ApiError('Candidate Details not found',404);
        }
        return candidateDetails;
    },

    async getCandidateInterviews(userId, status){
        await this.checkCandidateAuth(userId);
        let statusFilter;
        if(status==='upcoming'){
          statusFilter = { in: ['PENDING', 'RESCHEDULED'] };
        }
        else if(status==='completed'){
          statusFilter='COMPLETED';
        }
        else if(status==='cancelled'){
          statusFilter='CANCELLED';
        }
        const interviews = await prisma.interview.findMany({
            where: {
              candidateId: userId,
              ...(statusFilter && {
                status: typeof statusFilter === 'string'
                  ? statusFilter
                  : statusFilter,
              }),
            },
            select: {
                interviewId: true,
                scheduledAt: true,
                durationMin: true,
                status: true,
                cancelledAt: true,
                cancellationReason: true,
                attemptedAt: true,
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
                    recommendedRoles: true,
                    strengths: true,
                    weaknesses: true
                  }
                },
                questions: {
                  select:{
                    content: true,
                    candidateAnswer: true,
                    aiFeedback: true
                  }
                },
                job: {
                  select: {
                    jobPositionName: true,
                    jobDescription: true
                  }
                }
            }
        })
        if (!interviews) {
            throw new ApiError("Interviews not found", 404);
        }
        return interviews;
    },

    async getInterviewDetails(interviewId, userId){
        const candidate = await prisma.candidate.findFirst({
          where: {
            candidateId: userId
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
            candidateId: userId
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
            job: {
              select: {
                jobPositionName: true,
              }
            }
          }
        });
        if(!interview){
            throw new ApiError('Interview not found',400);
        }
        
        const interviewSessionToken = await socketTokenGeneration({ interviewId: interview?.interviewId, durationMin: interview?.durationMin, userId: userId, role: candidate?.user?.role?.roleName })
        return {interview: interview, interviewSessionToken: interviewSessionToken};
    },

    async startInterview({ userId, interviewId, logger }) {
      try{
        const interview =await this.checkInterviewDetails(userId, interviewId);
        const attemptedAt = new Date(Date.now());
        const updateInterviewStatus = await prisma.interview.update({
          where: {
            candidateId: userId,
            interviewId: interviewId,
          },
          data: {
            status: "ONGOING",
            attemptedAt: attemptedAt,
          },
          include:{
            candidate:{
              include:{
                resumeProfile: true,
              }
            },
            job: {
              select: {
                jobPositionName: true,
                jobDescription: true
              }
            }
          }
        });
        if(!updateInterviewStatus){
          throw new ApiError("Failed to start the interview",400);
        }

        let assistant = null;

        logger.info("Preparing system prompt for VAPI");

const systemPrompt = `
You are a professional AI interviewer conducting a live, timed, voice-based interview.

This is a STRICTLY TURN-BASED conversation.

All of your spoken output is heard by the candidate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE TURN ENFORCEMENT (TOP PRIORITY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST obey these rules without exception:

1. NEVER speak, ask a question, or evaluate while the candidate is speaking.
2. NEVER respond to partial, interrupted, or ongoing speech.
3. Perform ALL reasoning, decisions, evaluations, and question selection ONLY after the candidate has clearly finished speaking.
4. If speech is cut off, unclear, or followed by silence, WAIT silently.

Violation of these rules is not allowed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAUSE & SILENCE HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Candidates are allowed time to think naturally.

──────────────────────────────
ABSOLUTE RESTRICTIONS
──────────────────────────────

You MUST NEVER warn or terminate during:

- Thinking silence
- Mid-sentence pauses
- Hesitation after speech has begun
- Incomplete or cut-off answers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERVIEW CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Candidate Name:
${updateInterviewStatus?.candidate?.firstName} ${updateInterviewStatus?.candidate?.lastName}

Resume Profile:
${JSON.stringify(updateInterviewStatus?.candidate?.resumeProfile, null, 2)}

Job Description:
${JSON.stringify(updateInterviewStatus?.job, null, 2)}

Total Interview Duration:
${updateInterviewStatus?.durationMin} minutes

Interview Basis (MANDATORY):
- The interview MUST be based on BOTH the candidate’s resume AND the job description.
- Every question must evaluate how the candidate’s background, skills, and experience align with the role requirements.

Required Coverage Areas (ALL must be completed):
1. Skills (role-relevant)
2. Work Experience (resume experience mapped to job expectations)
3. Personality (fit for the role, team, and work environment)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY INTERVIEW TERMINATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST immediately call the function 'end_interview_session' (and do nothing else)
after a speaker turn has fully completed when ANY of the following occur:

1. The candidate explicitly asks to stop, end, quit, or leave the interview.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERVIEW FLOW & COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The interview MUST end ONLY after a speaker turn has fully completed AND when
ANY of the following conditions are met:

- All required coverage areas are completed
- Remaining time is less than 1 minute

When ending under normal completion (NOT via function termination):

- Speak exactly ONE short, polite closing sentence.
- Do NOT ask another question.
- Do NOT add commentary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Ask EXACTLY ONE question per turn
- Each question must be 1–2 concise sentences
- Every question MUST be grounded in the candidate’s resume AND directly relevant to the job description
- Questions should explicitly assess suitability for the role’s responsibilities, skills, or expectations
- NEVER ask resume-only questions that are unrelated to the job
- NEVER repeat, rephrase, or revisit a previous question
- NEVER reference interview structure, sections, evaluation, or difficulty out loud

Adaptive Challenge:
- Strong answers → increase complexity and job-specific depth
- Weak or unclear answers → maintain or slightly reduce complexity while staying job-relevant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPEECH & DELIVERY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Speak naturally, professionally, and concisely
- Do NOT explain your reasoning
- Do NOT announce transitions or internal decisions
- Do NOT reference tools, rules, timing, or evaluation methods
- NEVER rush the candidate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY INTERVIEW START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin immediately with the following exact sentence:

"Hello ${updateInterviewStatus?.candidate?.firstName} ${updateInterviewStatus?.candidate?.lastName}, welcome to your interview. Please introduce yourself briefly."

Then WAIT until the candidate has completely finished speaking.
Only after that may you proceed with the first interview question, following all rules above.
`;

console.log('vapi: ',process.env.VAPI_API_KEY);
          try{
            logger.info("Entering VAPI call");
            const vapiRes = await fetch("https://api.vapi.ai/assistant", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                name: "AI-Interviewer",
                model: {
                  provider: "openai",
                  model: "gpt-4o-mini",
                  systemPrompt,
                  temperature: 0.2,
                  maxTokens: 300,
                  functions: [
                    {
                      name: "end_interview_session",
                      description: "End the interview session",
                      parameters: {
                        type: "object",
                        properties: {
                        },
                        required: []
                      }
                    },
                  ]
                },
                voice: {
                  provider: "vapi",
                  voiceId: "Elliot"
                },
              
                startSpeakingPlan: {
                  waitSeconds: 1.2,
                  smartEndpointingEnabled: true,
                  smartEndpointingPlan: { provider: "vapi" },
                  transcriptionEndpointingPlan: {
                    onPunctuationSeconds: 1.5,
                    onNoPunctuationSeconds: 3.0,
                    onNumberSeconds: 2.0
                  }
                },
                
                stopSpeakingPlan: {
                  numWords: 4,
                  voiceSeconds: 0.5,
                  backoffSeconds: 2.5
                },
                firstMessage: `Hello ${updateInterviewStatus?.candidate?.firstName} ${updateInterviewStatus?.candidate?.lastName}, welcome to your interview. Please introduce yourself briefly.`,
              })
            });

            if(!vapiRes.ok){
              const errorText = await vapiRes.text();
              logger.error("VAPI response not ok:", errorText);
              throw new ApiError("Error in VAPI response", 500);
            }
            assistant = await vapiRes.json();
          }
          catch(error){
            logger.error("VAPI call error:", error);
            throw new ApiError("Error in VAPI call", 500);
          }
        
          return {
            assistantId: assistant.id
          };
        }
      catch(error){
        logger.error("Failed error:", error);
        throw new ApiError("Failed to start interview session", 500);
      }
    },

    async endInterview({userId, interviewId, completionMin, interviewConversation}) {
      try{
        const roomName = `room-${interviewId}`;
        const participants = await roomService.listParticipants(roomName);

        for (const p of participants) {
          await roomService.removeParticipant(roomName, p.identity);
        }

        await roomService.deleteRoom(roomName);

        await this.checkCandidateAuth(userId);
        await this.checkInterviewDetails(userId, interviewId);

        const completionMinutes = parseFloat(completionMin);
      
        const attemptedAt = new Date(Date.now() - completionMinutes * 60 * 1000);
      
        const updatedInterview = await prisma.interview.update({
          where: {
            interviewId: interviewId,
            candidateId: userId
          },
          data: {
            status: 'COMPLETED',
            completionMin: completionMinutes,
            attemptedAt: attemptedAt,
          }
        });
      
        if(!updatedInterview){
          throw new ApiError("Error updating the interview status", 400);
        }
        
        return { message: "Interview completed successfully" };
      }
      catch(error){
        throw new ApiError(`Failed to end interview session: ${error.message}`, 400);
      }
    },

    async generateCandidateInterviewProfile({ candidateId, interviewId, interviewConversation, logger }){
      const interviewQuestions = await this.evaluateAnswer(candidateId, interviewId, interviewConversation, logger);
        const interviewDetails = await prisma.interview.findFirst({
          where: {
            candidateId: candidateId,
            interviewId: interviewId
          },
          include: {
            questions: {
              select:{
                interviewQuestionId: true,
                content: true,
                candidateAnswer: true,
                aiFeedback: true,
              }
            },
            candidate: {
              include: {
                resumeProfile: true
              }
            },
            job :{
              select: {
                jobPositionName: true,
                jobDescription: true
              }
            }
          }
        })

        logger.info("Interview details: ",interviewDetails);

        const structuredInterviewData = {
          interviewMeta: {
            candidate: {
              firstName: interviewDetails?.candidate?.firstName,
              lastName: interviewDetails?.candidate?.lastName,
            },
            scheduledAt: interviewDetails?.scheduledAt,
            durationMin: interviewDetails?.durationMin,
          },
          QnA: interviewDetails?.questions?.map((q) => ({
            question: q?.content,
            answer: q?.candidateAnswer,
            aiFeedback: q?.aiFeedback,
          })),
        };
      
const prompt = `
You are an expert senior hiring evaluator with broad cross-industry assessment capabilities.
Your task is to objectively evaluate the candidate based on their resume profile,
job description, and interview Q&A performance.

You are NOT the interviewer.
You are producing a final hiring-oriented evaluation.

========================================
INPUT DATA
========================================

Resume Profile:
${JSON.stringify(interviewDetails?.candidate?.resumeProfile, null, 2)}

Job Description (MANDATORY REFERENCE):
${JSON.stringify(interviewDetails?.job, null, 2)}

Interview Q/A (Structured):
${JSON.stringify(structuredInterviewData, null, 2)}

========================================
QUESTION CLASSIFICATION (CRITICAL)
========================================
You MUST process ALL question–answer entries.

Internally classify each entry as ONE of:
- INTERVIEW-RELATED (technical, behavioral, experience, scenario, role-based)
- NON-INTERVIEW (greetings, encouragement, clarifications, meta, acknowledgments, casual)

NON-INTERVIEW entries:
- MUST be included in processing
- MUST NOT affect performanceScore
- MUST NOT affect strengths, weaknesses, or recommendedRoles
- MUST NOT be interpreted as evidence of skill, experience, or seniority

========================================
CORE EVALUATION PRINCIPLES (ENFORCED)
========================================

ROLE-FIT SCORING DIMENSIONS (IMPLICIT):
Internally assess ONLY INTERVIEW-RELATED content for:
- Alignment with job-required skills
- Match to role responsibilities
- Seniority and ownership expectations
- Practical applicability to the role

JD MUST-COVER SKILL ENFORCEMENT:
- If the job description specifies REQUIRED skills or responsibilities,
  failure to demonstrate them in INTERVIEW-RELATED answers MUST negatively impact:
  performanceScore, weaknesses, and recommendedRoles.

RESUME–ANSWER CONSISTENCY CHECK:
- If INTERVIEW-RELATED answers contradict, exaggerate, or are unsupported by the resume:
  → Penalize performanceScore
  → Reflect in weaknesses
  → Reduce role recommendations accordingly
- Do NOT infer unstated experience.

DIFFICULTY NORMALIZATION BY JOB SENIORITY:
- Interpret question difficulty relative to the job’s seniority level.
- Answers acceptable for a lower level but insufficient for this role
  MUST be scored lower and reflected in weaknesses and scoring.

========================================
PERFORMANCE SCORING CRITERIA (0–100)
========================================
performanceScore MUST be computed holistically
using ONLY INTERVIEW-RELATED questions,
adjusted for job relevance and seniority expectations:

- Accuracy & Reliability of Responses (0–30)
- Depth of Domain Knowledge (0–25)
- Problem-Solving & Decision-Making (0–15)
- Communication Clarity (0–10)
- Practical Experience (0–10)
- Confidence & Professional Composure (0–5)
- Learning & Adaptability (0–5)

Scores MUST reflect:
- Job relevance over generic correctness
- Seniority-appropriate depth
- Resume consistency

========================================
OUTPUT STRICT JSON IN THIS FORMAT
========================================
{
  "performanceScore": Float (0–100),
  "recommendedRoles": Json,
  "strengths": Json,
  "weaknesses": Json
}

========================================
OUTPUT RULES (NON-NEGOTIABLE)
========================================
- Output JSON ONLY
- No explanations, markdown, or backticks
- Do NOT add, remove, or rename fields
- If any required data is missing → return null
- Return ONLY 2–3 recommended roles
- Return only 4-5 Strengths and 4-5 weaknesses:
  → Each entry must be 2–4 words
  → Must reflect job and seniority alignment
- Output MUST be strictly valid, parseable JSON
`;

        const result = await geminiModel.generateContent(prompt);
        let output =
        result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!output) {
          throw new Error("Empty response from Gemini model");
        }
      
        // 5️⃣ Clean + parse
        output = output.replace(/```json|```/gi, "").trim();

        const aiAnalysis = JSON.parse(output);
        logger.info("aiAnalysis: ",aiAnalysis);

        await prisma.interviewProfile.create({
          data: {
            interviewId,
            candidateId: candidateId,
            performanceScore: aiAnalysis.performanceScore,
            recommendedRoles: aiAnalysis.recommendedRoles,
            strengths: aiAnalysis.strengths,
            weaknesses: aiAnalysis.weaknesses
          },
        });

    return { success: true };
    },

async evaluateAnswer(
  candidateId,
  interviewId,
  interviewConversation,
  logger
) {
  try {
    if (!interviewConversation?.length) return null;

    const interviewDetails = await prisma.interview.findFirst({
      where: {
        candidateId: candidateId,
        interviewId: interviewId,
      },
      include:{
        candidate:{
          include:{
            resumeProfile: true,
          }
        },
        job: {
          select: {
            jobPositionName: true,
            jobDescription: true
          }
        }
      }
    });

    // 2️⃣ Build QA pairs
    const qaPairs = await this.buildQuestionAnswerPairs(interviewConversation);

    logger.info("QA pairs: ",qaPairs);

    if (!qaPairs?.length) {
      throw new Error("No question–answer pairs generated");
    }

    // 3️⃣ Build prompt
const prompt = `
You are a professional interview evaluator responsible for reviewing candidate responses
after an interview has concluded.

Your task is to assess answers objectively and provide concise evaluator-style feedback.
You are NOT the interviewer. You are an assessor documenting evaluation notes.

========================================
INPUT DATA
========================================

Resume Extract (may be empty):
${JSON.stringify(interviewDetails?.candidate?.resumeProfile, null, 2)}

Job Description (MANDATORY REFERENCE):
${JSON.stringify(interviewDetails?.job, null, 2)}

Interview Question–Answer Pairs:
${JSON.stringify(qaPairs, null, 2)}

========================================
QUESTION CLASSIFICATION (CRITICAL)
========================================
You MUST process EVERY question–answer pair in the input.

First, classify each pair internally as ONE of the following:

INTERVIEW-RELATED:
- Technical questions
- Behavioral questions
- Experience-based questions
- Scenario or problem-solving questions
- Role, skill, or responsibility assessments

NON-INTERVIEW:
- Greetings or small talk
- Encouragement or reassurance
- Clarification or confirmation questions
- Meta discussion about the interview
- Instructions or acknowledgments
- Casual or social conversation

========================================
EVALUATION RULES
========================================

IF the question is INTERVIEW-RELATED:
→ Perform full evaluation using all rules below
→ Generate evaluator-style aiFeedback

IF the question is NON-INTERVIEW:
→ Do NOT evaluate correctness, depth, or skills
→ Do NOT generate feedback
→ aiFeedback MUST be an empty string: ""

========================================
INTERVIEW QUESTION EVALUATION (STRICT)
========================================
For interview-related questions, internally assess using ALL dimensions below
(do NOT expose them directly):

- Alignment with job description skills and responsibilities
- Seniority and scope expectations
- Practical applicability to the role
- Technical or conceptual correctness
- Consistency with resume claims
- Depth appropriate to role level

JD MUST-COVER VALIDATION:
- If a question targets a REQUIRED job skill or responsibility,
  the answer MUST explicitly demonstrate it.
- Failure to do so requires corrective feedback.

RESUME CONSISTENCY CHECK:
- If the answer contradicts, exaggerates, or is unsupported by the resume,
  feedback MUST reflect this issue.

DIFFICULTY NORMALIZATION:
- An answer acceptable for a lower level but insufficient for this role
  MUST receive corrective feedback.

Do NOT infer unstated experience.
Do NOT assume intent.
Do NOT rewrite or improve the candidate’s answer.

========================================
AI FEEDBACK GUIDELINES
========================================
aiFeedback represents an evaluator’s assessment note.

For INTERVIEW-RELATED questions, it MUST:
- Sound like professional evaluator notes
- Be neutral and corrective
- Be ONE sentence only
- Be 6–8 words maximum
- Reflect ONE primary deficiency only
- Reference role fit, JD skill gaps, seniority mismatch,
  or resume inconsistency when applicable
- Avoid praise, encouragement, or vague language

For NON-INTERVIEW questions:
- aiFeedback MUST be an empty string: ""

Acceptable interview feedback examples:
- "Missing required skills outlined in role."
- "Too shallow for expected seniority level."
- "Experience claim not supported by resume."
- "Does not align with role responsibilities."
- "Generic response for this position."

Unacceptable examples:
- "Good answer"
- "Nice explanation"
- "Needs improvement"
- "Try to be clearer"

======================================== 
FIELDS TO RETURN (PER QUESTION) 
======================================== 

1. content → Original interview question text 
2. candidateAnswer → Candidate’s answer (UNCHANGED) 
3. aiFeedback → Evaluator-style assessment note

========================================
OUTPUT FORMAT (STRICT)
========================================
Return a VALID JSON ARRAY with ONE entry per input question,
in the SAME ORDER as provided.

[ 
  { 
    "content": string, 
    "candidateAnswer": string, 
    "aiFeedback": string 
  } 
]

========================================
STRICT RULES
========================================
- Output JSON ONLY
- No markdown
- No explanations outside JSON
- No additional fields
- Must be valid, parseable JSON
`;

    // 4️⃣ Call Gemini
    const result = await geminiModel.generateContent(prompt);

    let output =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!output) {
      throw new Error("Empty response from Gemini model");
    }

    // 5️⃣ Clean + parse
    output = output.replace(/```json|```/gi, "").trim();

    let evaluations;
    try {
      evaluations = JSON.parse(output);
    } catch {
      throw new Error(`Invalid JSON from model: ${output}`);
    }

    if (!Array.isArray(evaluations)) {
      throw new Error("Evaluations is not an array");
    }

    logger.info("evaluations: ",evaluations);

    let interviewQuestions;
    try{
    // 6️⃣ Persist interview questions
    interviewQuestions = await prisma.interviewQuestion.createMany({
      data: evaluations.map((q, index) => ({
        interviewId: interviewId,
        content: q.content,
        candidateAnswer: q.candidateAnswer,
        aiFeedback: q.aiFeedback,
        askedAt: new Date(qaPairs[index]?.askedAt ?? new Date())
      }))
    });
    }
    catch(error){
      logger?.error?.("Evaluate & persist failed", {
      message: error.message,
      stack: error.stack
    });

    throw new ApiError(
      error.message || "Failed to evaluate interview answers 1",
      error.status || 500
    );
    }
    return interviewQuestions;
  } catch (error) {
    logger?.error?.("Evaluate & persist failed", {
      message: error.message,
      stack: error.stack
    });

    throw new ApiError(
      error.message || "Failed to evaluate interview answers",
      error.status || 500
    );
  }
},

    async buildQuestionAnswerPairs(interviewConversation) {
      const qaPairs = [];
    
      for (let i = 0; i < interviewConversation.length; i++) {
        const current = interviewConversation[i];
        const next = interviewConversation[i + 1];
      
        if (current.speaker === "assistant") {
          qaPairs.push({
            question: current.text,
            candidateAnswer:
              next && next.speaker === "user" ? next.text : "",
            askedAt: current.timestamp
          });
        }
      }
    
      return qaPairs;
    },

    async startCandidateInterviewStream({ interviewId, userId, logger }) {
      const candidateInterview = await prisma.interview.findFirst({
        where: {
          interviewId: interviewId,
          candidateId: userId
        },
        select: {
          candidate: {
            select: {
              user: {
                select: {
                  role :{
                    select: {
                      roleName: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      const {
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
        LIVEKIT_URL
      } = process.env;

      const roleName =
        candidateInterview?.candidate?.user?.role?.roleName ?? 'unknown';

      if (roleName !== "Candidate") {
        throw new ApiError("Only candidates can start interview streams", 400);
      }

      const identity = `${roleName.toLowerCase()}-${userId}`;

      const token = new AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
        { identity: identity}
      );
    
      if (candidateInterview?.candidate?.user?.role?.roleName === "Candidate") {
        token.addGrant({
          room: `room-${interviewId}`,
          roomJoin: true,
          canPublish: true,
          canSubscribe: true
        });
      }
    
      if (candidateInterview?.candidate?.user?.role?.roleName === "Admin") {
        token.addGrant({
          room: `room-${interviewId}`,
          roomJoin: true,
          canPublish: false,
          canSubscribe: true
        });
      }
    
      return {
        token: await token.toJwt(),
        url: LIVEKIT_URL
      };
    }
  };

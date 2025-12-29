import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError.util";
import { getAssemblyAIToken } from "../../utils/assemblyToken.util";
import { callGemini } from "../../utils/gemini.util";
import { roomService } from "../../utils/livekit.util";
import socketTokenGeneration from "../../utils/socketToken.util";
import { getTTSAudio } from "../../utils/tts.util";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AccessToken } from "livekit-server-sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY1);

const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

function parseJsonResponse(raw) {
  if (typeof raw !== "string") raw = JSON.stringify(raw);
  raw = raw.replace(/```[\s\S]*?json/i, "").replace(/```/g, "").trim();
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch (e2) {
        parsed = null;
      }
    }
  }
  return parsed;
}

function buildDecisionPrompt(question, candidateAnswer) {
  return `
You are a strict moderation and decisioning assistant for interviews. Given a candidate's answer OR follow-up message, decide which action to return:

Possible actions:
- "next_step": the candidate answer is related to the question field and can be graded/saved.
- "confirm": the candidate answer is irrelevant to the question field; ask the whether to continue.
- "proceed": the candidate answer has explicitly confirmed continuation using simple acknowledgments such as "sure", "yes", "yep", "go ahead", "ok", "alright", etc.

You MUST respond ONLY in JSON with THIS exact schema (no extra text):

{
  "action": "next_step" | "confirm" | "proceed",,
  "explanation": "<very very short reason>"
}

DEFINITIONS:
- "irrelevant" means the answer doesn't address the interview question at all (off-topic).
- "confirm" is for irrelevant answer.
- "proceed" ONLY applies when the candidate has clearly expressed explicit confirmation.

RULES:-
- Do not mention the 'Candidate' word in the 'action's' explanation. Give explanation as you are talking to the candidate directly.

Inputs:

Interview Question:
${question}

Candidate Answer:
${candidateAnswer}

Make a conservative decision: if you are uncertain whether to save, return "confirm". Keep JSON concise.
  `.trim();
}

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
        
        const interviewSessionToken = await socketTokenGeneration({ interviewId: interview?.interviewId, durationMin: interview?.durationMin, userId: userId, role: candidate?.user?.role?.roleName })
        return {interview: interview, interviewSessionToken: interviewSessionToken};
    },

    async getAssemblyAIToken(){
      try{
        const result = await getAssemblyAIToken();
        return result;
      }
      catch(error){
        throw new ApiError("Failed to get AssemblyAI token",500);
      }
    },

    async getTTSAudio(text){
      try{
        // await this.checkCandidateAuth(userId);
        const result = await getTTSAudio(text);
        return result;
      }
      catch(error){
        throw new ApiError("Failed to get TTS audio: " + error.message,500);
      }
    },

    async startInterviewSession(userId, interviewId) {
      try{
        const candidate =await this.checkCandidateAuth(userId);
        await this.checkInterviewDetails(userId, interviewId);

        const systemPrompt = `You are an interview assistant. Greet the candidate named ${candidate.firstName} ${candidate.lastName} with the short welcome in the interview and start the interview session, by asking them to introduce themselves in short. Output plain text: greeting + question.`;

        const aiRes = await callGemini(systemPrompt);
        let rawText = `Hello ${candidate.firstName} ${candidate.lastName}, please introduce yourself briefly?`;
        try {
          rawText =
            aiRes?.candidates?.[0]?.content?.parts?.[0]?.text ??
            aiRes?.text?.() ??
            rawText;
        } 
        catch(error){
          throw new ApiError("Failed to start interview session",500);
        }
        return { question: rawText, difficultyLevel: 2, section: 'Introduction'};
      }
      catch(error){
        throw new ApiError(`Failed to start interview session: ${error} and  ${error?.message}`,500);
      }
    },

    async endInterviewSession({userId, interviewId, completionMin}) {
      try{
        await this.checkCandidateAuth({userId});
        await this.checkInterviewDetails({userId, interviewId});

        const completionMinutes = parseFloat(completionMin);
        if (isNaN(completionMinutes)) {
          return NextResponse.json({ error: "Invalid completionMin value" }, { status: 400 });
        }
      
        const attemptedAt = new Date(Date.now() - completionMinutes * 60 * 1000);
      
        const updatedInterview = await prisma.interview.update({
          where: {
            interviewId: interviewId,
            candidateId: candidateId,
            status: { in: ['PENDING', 'RESCHEDULED'] }
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
        throw new ApiError("Failed to start interview session",500);
      }
    },

    async generateInterviewQuestion({ logger, userId, interviewId, candidate, remainingDuration, interviewDuration }) {
      try {
        await this.checkCandidateAuth(userId);
        await this.checkInterviewDetails(userId, interviewId);
        let previousQuestion = null;
        let interviewQuestions = null;
        interviewQuestions = await prisma.interviewQuestion.findMany({
            where: {
                interviewId: interviewId
            },
            select: {
              interviewQuestionId: true,
              content: true,
              candidateAnswer: true,
              correct: true,
              difficultyLevel: true,
              section: true,
              aiFeedback: true,
              askedAt: true
            },
            orderBy: {
              askedAt: 'asc'
            }
        })
      
        if(interviewQuestions.length>0){
            previousQuestion= interviewQuestions[interviewQuestions.length - 1];
        }
      
        const lastLevel = previousQuestion?.difficultyLevel ?? 2;
      
        const nextLevel =
          previousQuestion?.correct === true
            ? Math.min(5, lastLevel + 1)
            : previousQuestion?.correct === false
            ? Math.max(1, lastLevel - 1)
            : lastLevel;

        const prompt = `
You are acting as an experienced professional interviewer in the field of 
${JSON.stringify(candidate?.resumeProfile?.jobArea?.name)}, conducting a real-world interview for the candidate described in:
RESUME:
${JSON.stringify(candidate?.resumeProfile)}
INTERVIEW HISTORY:
${JSON.stringify(interviewQuestions)}
INPUTS:
- interviewDuration: ${interviewDuration}     // Total session duration
- remainingDuration: ${remainingDuration}     // Remaining time in the session
### Session Timing Rules:
Use "interviewDuration" and "remainingDuration" to:
- Pace question difficulty
- Decide when to shift sections
- Ensure the interview completes all sections before time runs out
- Adjust depth based on how much time is left
### Session Structure:
The interview must include all three sections:
1. Skills-based
2. Work Experience / Projects-based
3. Personality-based
Rules:
- Track which sections have been used so far
- Select the next section based on: performance, remaining time, and unmet sections
- Avoid running out of time before covering all required sections
### Performance Evaluation (Automatic):
Evaluate performance automatically based on ALL prior answers + their difficulty:
- Strong → accurate responses to medium/high difficulty items
- Average → partially correct or correct low difficulty responses
- Weak → inaccurate or incomplete responses
Performance affects progression:
- Strong → increase difficulty faster
- Average → maintain current difficulty
- Weak → slow down and reinforce basics
### Question Generation Rules:
Produce ONE concise question (1–2 lines) that:
- Directly relates to the candidate’s skills, tools, projects, or certifications in the resume
- Connects naturally to their contributions
- Does NOT repeat or rephrase ANY question from interview history
- Matches the calculated difficulty level (1–5)
- Does NOT include: commentary, explanations, “difficulty level,” or “section” in the question text
### Output Format:
Respond strictly in JSON:
{
  "question": "...",          // Only the interview question
  "section": "...",           // Skills / Work Experience / Personality
  "difficultyLevel": "..."    // Difficulty level (1–5) for THIS question
}
`;

        const qRes = await callGemini(prompt);
          // Extract content from Gemini response safely
          let questionContent =
            qRes?.candidates?.[0]?.content?.parts?.[0]?.text ??
            qRes?.text?.() ??
            null;
              
          // Clean formatting
          if (typeof questionContent === "string") {
            questionContent = questionContent.replace(/```[\s\S]*?json/i, "").trim();
            questionContent = questionContent.replace(/```/g, "").trim();
          }
        
          let qJson = null;
        
          // Attempt to parse JSON strictly
          try {
            qJson = JSON.parse(questionContent);
          } catch {
            // Fallback: attempt to extract JSON object from messy text
            const match = questionContent.match(/\{[\s\S]*\}/);
            if (match) {
              try {
                qJson = JSON.parse(match[0]);
              } catch {}
            }
          }
  
          return{
              previousQuestionFeedback : previousQuestion?.aiFeedback || "not available",
              question : qJson?.question ?? questionContent,
              section: qJson?.section ?? null,
              difficultyLevel: qJson?.difficultyLevel ?? null,
          };
      } 
      catch (err) {
        logger.error('Error in generateInterviewQuestion:', err);
        throw new ApiError('Failed to generate interview question',500);
    }
    },

    async generateFeedback({ userId, question, candidateAnswer, difficultyLevel, interviewId, resumeProfile, section, logger }) {
        try {
          await this.checkCandidateAuth(userId);
          await this.checkInterviewDetails(userId, interviewId);
          let savedQuestion = null;
          let grade = {};
          if(section !== 'Introduction')
          {
          const prompt = `
You are an expert technical interviewer and hiring evaluator. You will assess a candidate's interview answer based on the question, difficulty, section, and resume context.

You MUST respond **only in valid JSON** and follow this schema:
{
  "correct": "true | false",
  "aiFeedback": string,
}

DEFINITIONS:
- correct:
    true → candidate answered well and shows competency
    fail → insufficient or incorrect understanding
- aiFeedback: 
    Only one very short few 6-8 words sentence of generic like "Good job." Be precise and instructional.

You will be given:
- A resume extract (may be empty)
- The interview question
- Candidate’s answer
- Difficulty level

Evaluate the answer carefully. If the answer is vague, missing depth, or partially correct, reflect that honestly.

Now evaluate:
Resume:
${JSON.stringify(resumeProfile)}

Interview Question (difficulty {${difficultyLevel}}/5):
{${question}}

Question belongs to section:
{${section}}

Candidate Answer:
{${candidateAnswer}}
`;

          const gRes = await callGemini(prompt);
          let raw =
            gRes?.candidates?.[0]?.content?.parts?.[0]?.text ??
            (typeof gRes?.text === "function" ? gRes.text() : gRes?.text) ??
            "";
                
          if (typeof raw !== "string") {
            raw = JSON.stringify(raw);
          }
          
          // strip code fences just in case
          raw = raw.replace(/```[\s\S]*?json/i, "").replace(/```/g, "").trim();
          
          // Default grade values
          grade = {
            correct: 'false',
            aiFeedback: 'No feedback generated'
          };
        
          try {
            grade = JSON.parse(raw);
          } catch {
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                  grade = JSON.parse(jsonMatch[0]);
                } catch {}
              } else {
                grade.aiFeedback = raw.slice(0, 500);
              }
            }
          }

          savedQuestion = await prisma.interviewQuestion.create({
              data: {
                  interviewId: interviewId,
                  content: question,
                  candidateAnswer: candidateAnswer,
                  aiFeedback: section == 'Introduction' ? "Great" : grade.aiFeedback,
                  correct: section == 'Introduction' ? true : Boolean(grade.correct),
                  difficultyLevel: difficultyLevel,
                  section: section
              }
          })

          return { interviewQuestion: savedQuestion };
        } catch (err) {
            logger.error('Error in generateFeedback:', err);
            throw new ApiError('Failed to generate feedback',500);
        }
    },

    async generateResponse({ userId, question, candidateAnswer, interviewId, logger }){
      try{
        await this.checkCandidateAuth(userId);
        await this.checkInterviewDetails(userId, interviewId);
        
        const decisionPrompt = buildDecisionPrompt(question, candidateAnswer);
        const dRes = await callGemini(decisionPrompt);
        let dRaw =
          dRes?.candidates?.[0]?.content?.parts?.[0]?.text ??
          (typeof dRes?.text === "function" ? dRes.text() : dRes?.text) ??
          "";
        if (typeof dRaw !== "string") dRaw = JSON.stringify(dRaw);
        const dParsed = parseJsonResponse(dRaw) || {};
        console.log('dParsed', dParsed);

        // default fallback: when model fails, be conservative and require confirmation
        const action = (dParsed.action || "confirm").toLowerCase();
        console.log('Action',action);

        // If confirm and client has not sent proceed === true -> ask for confirmation
        if (action === 'confirm') {
          return {
            action: 'confirm',
            message: `${dParsed.explanation}. Shall we go to the next question?`
          };
        }
      
        else if(action === 'proceed'){
          return {
            action: 'proceed'
          };
        }
      
        else if(action === 'next_step'){
          return{
            action: 'next_step'
          };
        }
        return {
           action: 'confirm',
           message: 'I am sorry, but as an AI interviewer, I do not have information on that in particular. Shall we go to the next question?'
        };
      }
      catch(error){
        logger.error('Error in generateResponse 1:', error);
        throw new ApiError("Failed to generate response",500);
      }
    },

    async generateInterviewProfile({ candidateId, interviewId }){
        const candidate = await prisma.candidate.findFirst({
          where: {
            candidateId: candidateId,
            interviews: {
              some: {
                interviewId
              }
            }
          },
          include: {
            resumeProfile: true,
            interviews: {
              where: {
                interviewId
              },
              include: {
                questions: true
              }
            }
          }
        })

        const structuredInterviewData = {
          interviewMeta: {
            candidate: {
              firstName: candidate?.firstName,
              lastName: candidate?.lastName,
            },
            scheduledAt: candidate?.interviews?.scheduledAt,
            durationMin: candidate?.interviews?.durationMin,
          },
          QnA: candidate?.interviews[0]?.questions?.map((q) => ({
            question: q?.content,
            difficulty: q?.difficultyLevel,
            answer: q?.candidateAnswer,
            aiFeedback: q?.aiFeedback,
            correct: q?.correct,
          })),
        };
      
        const prompt = `
You are an expert senior hiring evaluator with broad cross-industry assessment capabilities. Your task is to objectively evaluate the candidate based on their resume profile and interview Q&A performance, regardless of professional field or specialization.
  
========================================
RESUME PROFILE
========================================
${JSON.stringify(candidate.resumeProfile, null, 2)}
  
========================================
INTERVIEW Q/A & FEEDBACK
========================================
${JSON.stringify(structuredInterviewData, null, 2)}
  
========================================
PERFORMANCE SCORING CRITERIA (0–100)
========================================
PerformanceScore must be determined by the following weighted evaluation model:
- Accuracy & Reliability of Responses (0–30): correctness and factual integrity.
- Depth of Domain Knowledge (0–25): conceptual understanding and reasoning depth.
- Problem-Solving & Decision-Making Approach (0–15): structured logical thinking and ability to resolve challenges.
- Communication Clarity (0–10): ability to express ideas clearly and professionally.
- Practical Experience (0–10): real-world application within their domain.
- Confidence & Professional Composure (0–5): self-assurance and calm reasoning.
- Learning & Adaptability (0–5): ability to grow, reflect, and incorporate feedback.
  
========================================
OUTPUT STRICT JSON IN THIS FORMAT
========================================
{
  "performanceScore": Float (0–100),
  "domainFit": Json,
  "recommendedRoles": Json,
  "strengths": Json,
  "weaknesses": Json,
  "analytics": {
    "totalQuestions": String,
    "correctAnswers": String,
    "averageDifficulty": Float
  }
}
  
========================================
RULES
========================================
- Output JSON only.
- No explanation or backticks.
- Do not add or modify fields.
- If any data is missing → return null.
- Return only 2–3 recommended roles.
- Strengths and weaknesses must contain 2–4 words each.
- The output must be strictly valid JSON.
`;
          
        const result = await geminiModel.generateContent(prompt);
        let output = result.response.text().trim();

        output = output
          .replace(/^```json/i, "")
          .replace(/^```/, "")
          .replace(/```$/, "")
          .trim();

        const aiAnalysis = JSON.parse(output);

        await prisma.interviewProfile.create({
          data: {
            interviewId,
            candidateId: candidateId,
            performanceScore: aiAnalysis.performanceScore,
            recommendedRoles: aiAnalysis.recommendedRoles,
            strengths: aiAnalysis.strengths,
            weaknesses: aiAnalysis.weaknesses,
            analytics: aiAnalysis.analytics,
          },
        });

    return { success: true };
    },

    async startInterview({ userId, interviewId, logger }) {
      logger.info("InterviewId: ",interviewId,"Userid: ",userId);
      try{
        const interview =await this.checkInterviewDetails(userId, interviewId);
        const updateInterviewStatus = await prisma.interview.update({
          where: {
            candidateId: userId,
            interviewId: interviewId,
          },
          data: {
            status: "ONGOING"
          },
          include:{
            candidate:{
              include:{
                resumeProfile: true,
              }
            }
          }
        });
        logger.info("updateInterviewStatus ",updateInterviewStatus);
        if(!updateInterviewStatus){
          throw new ApiError("Failed to start the interview",400);
        }

        let assistant = null;

        logger.info("Preparing system prompt for VAPI");

const systemPrompt = `
You are a professional AI interviewer conducting a live, timed, voice-based interview.

This is a STRICTLY TURN-BASED conversation.
You may act ONLY after the candidate has fully finished speaking.

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
THINKING & PAUSE ALLOWANCE (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Candidates are explicitly allowed time to think.

- Natural pauses, hesitation, or silence used for thinking are NORMAL and EXPECTED.
- You MUST NOT interrupt, rush, prompt, or move on while the candidate is thinking.
- You MUST remain completely silent during thinking pauses.
- Do NOT assume the candidate is finished unless their speech has clearly ended.

Short or moderate silence MUST NEVER be treated as disengagement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERVIEW CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Candidate Name:
${updateInterviewStatus?.candidate?.firstName} ${updateInterviewStatus?.candidate?.lastName}

Resume Profile:
${JSON.stringify(updateInterviewStatus?.candidate?.resumeProfile, null, 2)}

Total Interview Duration:
${updateInterviewStatus?.durationMin} minutes

Required Coverage Areas (ALL must be completed):
1. Skills
2. Work Experience
3. Personality

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY INTERVIEW TERMINATION (FUNCTION CALL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST immediately call the function 'end_interview_session' (and do nothing else) after a speaker turn has fully completed when ANY of the following occur:

1. The candidate explicitly asks to stop, end, quit, or leave the interview.
2. The candidate is unresponsive for an extended, system-defined silence timeout that clearly exceeds normal thinking time.

Important:
- Thinking pauses or reflective silence MUST NOT trigger termination.
- Do NOT warn, prompt, or pressure the candidate during silence.

In termination cases:
- Do NOT ask another question
- Do NOT speak a closing sentence
- Do NOT add commentary
- ONLY call the 'end_interview_session' function

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERVIEW FLOW & COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The interview MUST end ONLY after a speaker turn has fully completed AND when ANY of the following conditions are met:
- All required coverage areas are completed
- Remaining time is less than 1 minute

When ending the interview under normal completion (NOT via function termination), you MUST:
1. Speak exactly ONE short, polite closing sentence

❌ Do NOT ask another question  
❌ Do NOT add commentary after the closing sentence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Ask EXACTLY ONE question per turn
- Each question must be 1–2 concise sentences
- Every question MUST be grounded in the candidate’s resume
- NEVER repeat, rephrase, or revisit a previous question
- NEVER reference interview structure, sections, evaluation, or difficulty out loud

Adaptive Challenge:
- Strong answers → gradually increase complexity
- Weak or unclear answers → maintain or slightly reduce complexity

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
                  waitSeconds: 0.3,
                  smartEndpointingEnabled: true,
                  smartEndpointingPlan: { provider: "vapi" },
                  transcriptionEndpointingPlan: {
                    onPunctuationSeconds: 0.7,
                    onNoPunctuationSeconds: 3.0,
                    onNumberSeconds: 1.2
                  }
                },
              
                stopSpeakingPlan: {
                  numWords: 2,
                  voiceSeconds: 0.5,
                  backoffSeconds: 1.5
                },
                firstMessage: `Hello ${updateInterviewStatus?.candidate?.firstName} ${updateInterviewStatus?.candidate?.lastName}, welcome to your interview. Please introduce yourself briefly.`
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
        const candidate = await prisma.candidate.findFirst({
          where: {
            candidateId: candidateId,
            interviews: {
              some: {
                interviewId
              }
            }
          },
          include: {
            resumeProfile: true,
            interviews: {
              where: {
                interviewId
              },
              include: {
                questions: true
              }
            }
          }
        })

        logger.info("Questions: ",candidate?.interviews[0]?.questions);

        const structuredInterviewData = {
          interviewMeta: {
            candidate: {
              firstName: candidate?.firstName,
              lastName: candidate?.lastName,
            },
            scheduledAt: candidate?.interviews?.scheduledAt,
            durationMin: candidate?.interviews?.durationMin,
          },
          QnA: candidate?.interviews[0]?.questions?.map((q) => ({
            question: q?.content,
            difficulty: q?.difficultyLevel,
            answer: q?.candidateAnswer,
            aiFeedback: q?.aiFeedback,
            correct: q?.correct,
          })),
        };
      
        const prompt = `
You are an expert senior hiring evaluator with broad cross-industry assessment capabilities. Your task is to objectively evaluate the candidate based on their resume profile and interview Q&A performance, regardless of professional field or specialization.
  
========================================
RESUME PROFILE
========================================
${JSON.stringify(candidate.resumeProfile, null, 2)}
  
========================================
INTERVIEW Q/A
========================================
${JSON.stringify(structuredInterviewData, null, 2)}
  
========================================
PERFORMANCE SCORING CRITERIA (0–100)
========================================
PerformanceScore must be determined by the following weighted evaluation model:
- Accuracy & Reliability of Responses (0–30): correctness and factual integrity.
- Depth of Domain Knowledge (0–25): conceptual understanding and reasoning depth.
- Problem-Solving & Decision-Making Approach (0–15): structured logical thinking and ability to resolve challenges.
- Communication Clarity (0–10): ability to express ideas clearly and professionally.
- Practical Experience (0–10): real-world application within their domain.
- Confidence & Professional Composure (0–5): self-assurance and calm reasoning.
- Learning & Adaptability (0–5): ability to grow, reflect, and incorporate feedback.
  
========================================
OUTPUT STRICT JSON IN THIS FORMAT
========================================
{
  "performanceScore": Float (0–100),
  "domainFit": Json,
  "recommendedRoles": Json,
  "strengths": Json,
  "weaknesses": Json,
  "analytics": {
    "totalQuestions": String,
    "correctAnswers": String,
    "averageDifficulty": Float
  }
}
  
========================================
RULES
========================================
- Output JSON only.
- No explanation or backticks.
- Do not add or modify fields.
- If any data is missing → return null.
- Return only 2–3 recommended roles.
- Strengths and weaknesses must contain 2–4 words each.
- The output must be strictly valid JSON.
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
            weaknesses: aiAnalysis.weaknesses,
            analytics: aiAnalysis.analytics,
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
    // 1️⃣ Fetch candidate
    const candidate = await prisma.candidate.findFirst({
      where: { candidateId },
      include: { resumeProfile: true }
    });

    if (!candidate || !interviewConversation?.length) return null;

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
${JSON.stringify(candidate?.resumeProfile, null, 2)}

Interview Question–Answer Pairs:
${JSON.stringify(qaPairs, null, 2)}

========================================
EVALUATION INSTRUCTIONS
========================================
Evaluate EACH question–answer pair independently.

Assess each answer based ONLY on provided input:
- Relevance to the question
- Technical or conceptual correctness
- Level of detail relative to difficulty
- Alignment with industry expectations

Do NOT infer unstated experience.
Do NOT assume intent.
Do NOT rewrite or improve the candidate’s answer.

========================================
CORRECTNESS CRITERIA
========================================
correct = true
→ Answer is relevant and at least partially correct

correct = false
→ Answer is incorrect, irrelevant, evasive, or lacks required detail

========================================
AI FEEDBACK GUIDELINES
========================================
aiFeedback represents an evaluator’s assessment note.

It MUST:
- Sound like professional evaluation feedback
- Be neutral and corrective
- Be ONE sentence only
- Be 6–8 words maximum
- State what was missing, unclear, or insufficient
- Avoid praise or encouragement
- Avoid vague wording

Acceptable feedback examples:
- "Lacks clarity on role and responsibilities."
- "Did not address the question directly."
- "Missing specific examples and outcomes."
- "Response too vague for stated experience."

Unacceptable feedback examples:
- "Good answer"
- "Nice explanation"
- "Try to be clearer"
- "Needs improvement"

========================================
FIELDS TO RETURN (PER QUESTION)
========================================
1. content
   → Original interview question text

2. candidateAnswer
   → Candidate’s answer (UNCHANGED)

3. correct
   → boolean

4. difficultyLevel
   → number from 1–5 (as provided)

5. aiFeedback
   → Evaluator-style assessment note

========================================
OUTPUT FORMAT (STRICT)
========================================
Return a VALID JSON ARRAY in the SAME ORDER as input:

[
  {
    "content": string,
    "candidateAnswer": string,
    "correct": boolean,
    "difficultyLevel": number,
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
        correct: q.correct,
        difficultyLevel: q.difficultyLevel,
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

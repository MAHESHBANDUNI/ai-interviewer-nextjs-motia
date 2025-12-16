import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError.util";
import { getAssemblyAIToken } from "../../utils/assemblyToken.util";
import { callGemini } from "../../utils/gemini.util";
import { getTTSAudio } from "../../utils/tts.util";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
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
              in: ['PENDING', 'RESCHEDULED'],
            },
          },
        });

        if(!interview){
          throw new ApiError(400,'Failed to start interview session');
        }

        return true;
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

    async getCandidateInterviews(userId){
        await this.checkCandidateAuth(userId);
        const interviews = await prisma.interview.findMany({
            where: {
              candidateId: userId,
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
            throw new ApiError("Interviews not found", 404);
        }
        return interviews;
    },

    async getInterviewDetails(interviewId, userId){
      await this.checkCandidateAuth(userId);
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
        return interview;
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
      try{
        await this.checkInterviewDetails(userId, interviewId);
        const candidate = await prisma.candidate.findFirst({
          where: {
            candidateId: userId
          },
          include: {
            resumeProfile: true
          }
        });
        if(!candidate){
          throw new ApiError("Candidate not found",400);
        }

        let assistant = null;

        logger.info("Preparing system prompt for VAPI");

        const systemPrompt = `
You are a professional AI interviewer.

Candidate Name: ${candidate.firstName} ${candidate.lastName}

Resume Profile:
${JSON.stringify(candidate.resumeProfile, null, 2)}
  
### Session Structure:
The interview must include all three sections:
1. Skills-based
2. Work Experience / Projects-based
3. Personality-based

STRICT RULES:

1. When you ask a question:
   - Speak the question naturally
   - THEN immediately call the tool 'log_question_metadata'
   - Include:
     - the exact question text
     - difficultyLevel (1–5)
     - section (Skills, Work Experience, Personality)

2. After the candidate finishes answering:
   - Evaluate the answer carefully
   - THEN immediately call the tool 'log_candidate_evaluation'
   - Include:
     - the exact question
     - the candidate answer
     - correct: true or false
     - a short feedback sentence

3. NEVER explain difficulty or correctness out loud.
4. Ask ONLY one question at a time.
5. Adjust difficulty based on past correctness.
6. Avoid repeating questions.

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
- Does NOT include: commentary, explanations, “difficulty level,” or “section” in the question text;

Rules:
- Greet the candidate shortly at the start of the interview, and firstly ask them to introduce themselves briefly.
- Ask exactly ONE question at a time
- Keep questions concise
- Adjust difficulty (1–5)
- Cover Skills, Work Experience, Personality
- Do NOT explain answers
- Decide next action after every answer
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
                  provider: "google",
                  model: "gemini-2.5-flash-lite",
                  systemPrompt,
                  temperature: 0.2,
                  maxTokens: 300,
                
                  // ✅ FUNCTIONS GO HERE
                  functions: [
                    {
                      name: "log_question_metadata",
                      description: "Log metadata for the asked interview question",
                      parameters: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          difficultyLevel: { type: "number" },
                          section: { type: "string" }
                        },
                        required: ["question", "difficultyLevel", "section"]
                      }
                    },
                    {
                      name: "log_candidate_evaluation",
                      description: "Evaluate the candidate answer",
                      parameters: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          candidateAnswer: { type: "string" },
                          correct: { type: "boolean" },
                          aiFeedback: { type: "string" }
                        },
                        required: ["question", "candidateAnswer", "correct"]
                      }
                    }
                  ]
                },
                voice: {
                  provider: "vapi",
                  voiceId: "Elliot"
                }
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
        await this.checkCandidateAuth({userId});
        await this.checkInterviewDetails({userId, interviewId});

        const completionMinutes = parseFloat(completionMin);
      
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

        await prisma.interviewQuestion.createMany({
          data: interviewConversation.map((q, index) => ({
            interviewId,
            content: q.content,
            aiFeedback: q.aiFeedback,
            candidateAnswer: q.candidateAnswer,
            correct: q.correct,
            difficultyLevel: q.difficultyLevel,
            askedAt: q.askedAt
          }))
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

    async generateCandidateInterviewProfile({ candidateId, interviewId }){
      // const response = await this.evaluateAnswer({candidateId, interviewId, liveTranscript});
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

    async evaluateAnswer({ candidateId, interviewId, liveTranscript }) {
      try {
        const candidate = await prisma.candidate.findFirst({
          where: { candidateId },
          include: {
            resumeProfile: true
          }
        });
      
        if (!candidate || !liveTranscript?.length) return null;
        const qaPairs = await this.buildQuestionAnswerPairs(liveTranscript);
      
const prompt = `
You are a senior technical interviewer and hiring evaluator with cross-industry expertise.
Your task is to objectively evaluate a candidate’s interview performance based ONLY on the
question–answer pairs provided below.

You must judge correctness, clarity, and depth of understanding for each answer.

========================================
INTERVIEW QUESTION–ANSWER PAIRS
========================================
Each object contains:
- question: the interviewer’s question
- candidateAnswer: the candidate’s response

${JSON.stringify(qaPairs, null, 2)}

========================================
EVALUATION GUIDELINES
========================================
For EACH question:

1. Correctness (true / false)
   - true → the answer is mostly correct and demonstrates understanding
   - false → the answer is incorrect, misleading, or significantly incomplete

2. Difficulty Level (1–5)
   Determine difficulty based on the question itself, NOT the candidate’s performance:
   1 → Very basic / introductory
   2 → Fundamental knowledge
   3 → Intermediate professional level
   4 → Advanced / in-depth
   5 → Expert / system-level reasoning

3. Candidate Answer
   - Preserve the candidate’s answer exactly as provided
   - Do NOT rewrite or summarize it

========================================
OUTPUT FORMAT (STRICT)
========================================
Return a JSON ARRAY with ONE object per question,
in the SAME ORDER as the input.

Each object MUST have EXACTLY these fields:
[
  {
    "content": string,           // the interview question
    "candidateAnswer": string,   // the candidate’s answer (unchanged)
    "correct": boolean,          // true or false
    "difficultyLevel": number    // integer 1–5
  }
]

========================================
STRICT RULES
========================================
- Output JSON ONLY (no text, no markdown, no backticks)
- Do NOT add, remove, or rename fields
- Do NOT include explanations or comments
- Do NOT infer missing answers
- If an answer is vague or partial → mark "correct": false
- Ensure the output is valid JSON and parsable
`;


        const result = await geminiModel.generateContent(prompt);
        let output = result.response.text().trim();

        output = output
          .replace(/^```json/i, "")
          .replace(/^```/, "")
          .replace(/```$/, "")
          .trim();

        const evaluations = {
          content: evaluations.content,
          candidateAnswer: evaluations.candidateAnswer,
          correct: evaluations.correct,
          difficultyLevel: evaluations.difficultyLevel
        } = JSON.parse(output);
      
        // ✅ Create one DB row per question
        await prisma.interviewQuestion.createMany({
          data: evaluations.map((q, index) => ({
            interviewId,
            content: q.content,
            candidateAnswer: q.candidateAnswer,
            correct: q.correct,
            difficultyLevel: q.difficultyLevel,
            askedAt: new Date(qaPairs[index].askedAt)
          }))
        });
      
        return evaluations;
      } catch (error) {
        throw new ApiError("Failed to evaluate answer", 500);
      }
    },

    async buildQuestionAnswerPairs(liveTranscript) {
      const qaPairs = [];
    
      for (let i = 0; i < liveTranscript.length - 1; i++) {
        const current = liveTranscript[i];
        const next = liveTranscript[i + 1];
      
        if (
          current.speaker === "assistant" &&
          next.speaker === "user"
        ) {
          qaPairs.push({
            question: current.text,
            candidateAnswer: next.text,
            askedAt: current.timestamp
          });
        }
      }
      return qaPairs;
    }

  };

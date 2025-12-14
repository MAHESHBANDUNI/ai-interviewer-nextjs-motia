import nodemailer from 'nodemailer';
import { ApiError } from './apiError.util';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SECURE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendScheduledInterviewMail = async (maildetails) => {
    try{
        const {candidateEmail, candidateName, loginUrl, candidatePassword, meetingTime} = maildetails;
        if(!candidateEmail || !candidateName || !loginUrl || !candidatePassword || !meetingTime) {
          throw new ApiError("Missing mail details", 400);
        }
        const info = await transporter.sendMail({
          from: `"AI Interviewer" <${process.env.SMTP_USER}>`,
          to: candidateEmail,
          subject: "Interview Invitation",
          text:
            `Dear ${candidateName},\n\n` +
            `We’re pleased to invite you for an interview scheduled on ${meetingTime}.\n\n` +
            `To proceed, please log in to your account using the following credentials:\n\n` +
            `Login URL: ${loginUrl}\n` +
            `Email: ${candidateEmail}\n` +
            `Password: ${candidatePassword}\n\n` +
            `Once logged in, your scheduled interview details will be available in the Interview section.\n\n` +
            `If you have any questions or issues, please reply to this email.\n\n` +
            `Best regards,\n` +
            `AI Interviewer\n`,
          html:
            `<p>Dear ${candidateName},</p>
            <p>We’re pleased to invite you for an interview scheduled on <strong>${meetingTime}</strong>.</p>
            <p>To proceed, please log in to your account using the credentials below:</p>
            <ul>
              <li><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
              <li><strong>Email:</strong> ${candidateEmail}</li>
              <li><strong>Password:</strong> ${candidatePassword}</li>
            </ul>
            <p>After logging in, you can view your scheduled interview details in the Interview section.</p>
            <p>If you have any questions, feel free to reply to this email.</p>
            <p>We look forward to speaking with you!</p>
            <p>Best regards,<br/>
            AI INTERVIEWER<br/>`
        });
        const success = info.accepted && info.accepted.length > 0;  
        return {
          success,
          messageId: info.messageId,
          message: success ? "Email sent successfully" : "Email rejected by SMTP server"
        };
    }
    catch (error) {
      throw new ApiError(400, "Failed to send email");
    }
};

export const sendRescheduledInterviewMail = async (maildetails) => {
    try{
      const { candidateEmail, candidateName, loginUrl, meetingTime, oldMeetingTime} = maildetails;
      if(!candidateEmail || !candidateName || !loginUrl || !oldMeetingTime || !meetingTime) {
        throw new ApiError("Missing mail details", 400);
      }
      const subject = "Interview Rescheduled";

      const textMessage = `Dear ${candidateName},\n\n` +
          `Your interview has been rescheduled.\n\n` +
          `Old Timing: ${oldMeetingTime}\n` +
          `New Timing: ${meetingTime}\n\n` +
          `Please log in using your existing credentials to view updated interview details.\n\n` +
          `Login URL: ${loginUrl}\n\n` +
          `Best regards,\nAI Interviewer\n`
        ;

      const htmlMessage = `
          <p>Dear ${candidateName},</p>
          <p>Your interview has been <strong>rescheduled</strong>.</p>
          <p>
            <strong>Old Timing:</strong> ${oldMeetingTime}<br/>
            <strong>New Timing:</strong> ${meetingTime}
          </p>
          <p>Please log in using your existing credentials to view updated interview details:</p>
          <ul>
            <li><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
          </ul>
          <p>Best regards,<br/>AI Interviewer</p>
        `;

      const info = await transporter.sendMail({
        from: `"AI Interviewer" <${process.env.SMTP_USER}>`,
        to: candidateEmail,
        subject,
        text: textMessage,
        html: htmlMessage
      });

      const success = info.accepted && info.accepted.length > 0;  
      return {
        success,
        messageId: info.messageId,
        message: success ? "Email sent successfully" : "Email rejected by SMTP server"
      };
    }
    catch (error) {
      throw new ApiError(400, "Failed to send email");
    }
}
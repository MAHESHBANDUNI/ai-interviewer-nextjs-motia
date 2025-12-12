import { z } from "zod";
import { AdminService } from "../../../../services/admin/admin.service";

export const config = {
  name: "ViewResume",
  type: "api",
  path: "/api/admin/candidate/resume/view",
  method: "GET",
  description: "Serve candidate resume PDF",
  emits: [],
  flows: [],
};

export const handler = async(req, {emit, logger}) =>{
    try{
       logger.info('Retrieving candidate resume', { appName: process.env.APP_NAME || 'AI-Interviewer', timestamp: new Date().toISOString() });
        const fileName = req?.queryParams?.fileName;
        logger.info("Filename 2: ",fileName);
        if (!fileName) {
          return {
            status: 400,
            body: { error: "fileName is required" },
          };
        }
        const { stream, contentType, contentLength } = await AdminService.getCandidateResume(fileName);
        return {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/pdf",
        "Content-Disposition": "inline; filename=\"" + fileName + "\"", // Force inline
        "Cache-Control": "no-store",
        "X-Frame-Options": "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
      },
      body: stream, // Node.js stream directly
    };
    }
    catch (error) {
      if (logger) {
        logger.error('Failed to retrieve resume', { error: error.message, status: error.status });
      }
      return {
        status: error.status || 500,
        body: {
          error: error.message || 'Internal server error'
        }
      };
    } 
}
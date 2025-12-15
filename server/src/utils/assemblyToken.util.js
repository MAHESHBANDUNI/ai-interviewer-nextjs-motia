import { AssemblyAI } from "assemblyai";
import { ApiError } from "./apiError.util";

export const getAssemblyAIToken = async() => {
    try {
        const client = new AssemblyAI({
            apiKey: process.env.ASSEMBLYAI_API_KEY,
          });

        const token = await client.streaming.createTemporaryToken({ expires_in_seconds: 600 });
        if (!token) throw new ApiError("Failed to get AssemblyAI token", 500);

        return token;
    } catch (err) {
        throw new ApiError("Failed to get AssemblyAI token", 500);
    }
} 


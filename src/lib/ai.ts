import { GoogleGenerativeAI, type ModelParams } from "@google/generative-ai";

const getApiKey = (): string => {
    const key = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error(
            "Neither GOOGLE_GENAI_API_KEY nor GEMINI_API_KEY is defined in the environment variables."
        );
    }
    return key;
};

// Lazily initialize the GoogleGenerativeAI client so importing this file never crashes at build/module-load time
export const getModel = (modelOrParams: string | ModelParams = "gemini-3.8-flash") => {
    const genAI = new GoogleGenerativeAI(getApiKey());
    if (typeof modelOrParams === "string") {
        return genAI.getGenerativeModel({ model: modelOrParams });
    }
    return genAI.getGenerativeModel(modelOrParams);
};

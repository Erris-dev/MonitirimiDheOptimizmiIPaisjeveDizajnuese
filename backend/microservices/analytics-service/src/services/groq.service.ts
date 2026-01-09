import { groq } from '../config/groq';

export const generateAIResponse = async (healthData: any, userQuery: string) => {
  try {
    // 1. Build a clean prompt
    const prompt = `You are a professional health analyzer. 
    LATEST METRICS: ${JSON.stringify(healthData)}
    USER QUESTION: ${userQuery}`;

    // 2. Call Groq with a valid model name
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You analyze health metrics. Provide concise, medical-style insights."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile", // This is the correct Groq model ID
      temperature: 0.5,
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || "No response from AI";
  } catch (error: any) {
    // Improved error logging to see exactly why Groq might fail
    console.error("Groq API Error Detail:", error.response?.data || error.message);
    throw new Error(`Groq Analysis Failed: ${error.message}`);
  }
};
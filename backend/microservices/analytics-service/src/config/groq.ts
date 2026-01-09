import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error('❌ Error: GROQ_API_KEY is missing from environment variables.');
}

// Export the native Groq client
export const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});
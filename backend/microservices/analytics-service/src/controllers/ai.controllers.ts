import { Request, Response } from 'express';
import * as AIService from '../services/groq.service';
import { latestHealthData } from '../cache';

export const askAI = async (req: Request, res: Response) => {
  try {
    const healthData = latestHealthData.current;

    if (!healthData) {
      return res.status(404).json({ 
        error: "No metrics have been processed by the system yet." 
      });
    }

    const response = await AIService.generateAIResponse(
      healthData, 
      "Analyze these health metrics and give me advice."
    );
    
    res.status(200).json({ 
      success: true, 
      metrics: healthData, 
      answer: response 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
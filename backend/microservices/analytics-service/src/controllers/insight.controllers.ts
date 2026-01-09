import { Request, Response } from 'express';
import { Insight } from '../models/Insight';
import { latestHealthData } from '../cache';

export const saveInsight = async (req: Request, res: Response) => {
  try {
    // 1. Grab data from the Kafka "Global Locker"
    const healthData = latestHealthData.current;
    
    // 2. Grab the AI response from the body (if they chose to generate it)
    const { aiAnswer } = req.body;

    if (!healthData) {
      return res.status(404).json({ 
        success: false, 
        error: "No metrics available in cache to save." 
      });
    }

    // 3. Use req.userId (populated by your authMiddleware)
    const newInsight = new Insight({
      userId: req.userId, 
      predictions: healthData.predictions,
      recommendations: healthData.recommendations,
      aiAnalysis: aiAnswer || null, // Optional: only if they did the AI step
      processedAt: new Date()
    });

    await newInsight.save();

    res.status(201).json({
      success: true,
      message: "Health report saved to your history.",
      data: newInsight
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const history = await Insight.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: history.length, 
      data: history 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
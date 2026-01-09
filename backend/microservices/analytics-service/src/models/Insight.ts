import mongoose, { Schema, InferSchemaType } from 'mongoose';

const insightSchema = new Schema({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  // Use 'Mixed' or a flexible Object for metrics 
  // because AI/Kafka response structures often change
  predictions: {
    type: Schema.Types.Mixed, 
    required: true
  },
  recommendations: {
    type: Schema.Types.Mixed,
    required: true
  },
  
  // Store the full Markdown string from Groq here
  aiAnalysis: {
    type: String
  },

  // Keep this for future chat features!
  aiConversation: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],

  processedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true // Adds createdAt and updatedAt automatically
});

export type InsightType = InferSchemaType<typeof insightSchema>;
export const Insight = mongoose.model('Insight', insightSchema);
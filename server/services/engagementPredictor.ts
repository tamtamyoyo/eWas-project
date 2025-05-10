import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

interface PredictionInput {
  content: string;
  mediaUrls?: string[];
  platform: string;
  userFollowers?: number;
  userType?: string;
}

export interface EngagementPrediction {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagementRate: number;
  score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  recommendedTags?: string[];
}

/**
 * Service for predicting engagement metrics for social media posts
 */
export const EngagementPredictor = {
  /**
   * Generate engagement predictions for a post on multiple platforms
   * @param input Prediction input data
   * @returns Engagement predictions
   */
  async predictEngagement(input: PredictionInput): Promise<EngagementPrediction> {
    try {
      // Determine the potential reach based on platform
      let baseReach = 0;
      let likeMultiplier = 1;
      let commentMultiplier = 1;
      let shareMultiplier = 1;
      
      switch (input.platform) {
        case 'twitter':
          baseReach = 500;
          likeMultiplier = 1.2;
          commentMultiplier = 0.8;
          shareMultiplier = 1.5;
          break;
        case 'facebook':
          baseReach = 400;
          likeMultiplier = 1.5;
          commentMultiplier = 1.2;
          shareMultiplier = 1.0;
          break;
        case 'instagram':
          baseReach = 600;
          likeMultiplier = 1.8;
          commentMultiplier = 1.0;
          shareMultiplier = 0.7;
          break;
        case 'linkedin':
          baseReach = 300;
          likeMultiplier = 1.0;
          commentMultiplier = 1.5;
          shareMultiplier = 0.8;
          break;
        default:
          baseReach = 450;
      }
      
      // Adjust reach based on user followers if available
      if (input.userFollowers) {
        baseReach = Math.min(input.userFollowers * 0.3, baseReach * 3);
      }
      
      // Add a bonus for media attachments
      const mediaBonus = input.mediaUrls && input.mediaUrls.length > 0 ? 1.4 : 1.0;
      
      // Use AI to analyze content and predict engagement
      const prompt = `
Analyze the following social media post for ${input.platform} and predict engagement metrics.
Generate a JSON response with engagement predictions including likes, comments, shares, reach, 
engagement rate (as decimal), overall score (0-100), sentiment analysis (positive/negative/neutral), 
and recommended hashtags.

POST CONTENT:
${input.content}

${input.mediaUrls && input.mediaUrls.length > 0 ? `POST HAS ${input.mediaUrls.length} MEDIA ATTACHMENTS` : 'POST HAS NO MEDIA ATTACHMENTS'}

Make predictions based on:
- Platform trends on ${input.platform}
- Content quality and relevance
- Use of hashtags and keywords
- Emotional appeal and call-to-action
- Content length appropriateness for platform
- Media attachments (if present)

Response format:
{
  "likes": [number],
  "comments": [number],
  "shares": [number],
  "reach": [number],
  "engagementRate": [decimal between 0-1],
  "score": [number between 0-100],
  "sentiment": ["positive"/"negative"/"neutral"],
  "recommendedTags": [array of relevant hashtags without the # symbol]
}
`;

      // Query AI for predictions
      const aiResponse = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: "You are an expert social media analytics AI that helps predict engagement metrics for posts on various platforms. You understand what content performs well on different platforms." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse AI response
      const aiPrediction = JSON.parse(aiResponse.choices[0].message.content || "{}");
      
      // Apply platform and media multipliers to the AI prediction
      const prediction: EngagementPrediction = {
        likes: Math.round(aiPrediction.likes * likeMultiplier * mediaBonus) || Math.floor(baseReach * 0.2 * likeMultiplier * mediaBonus),
        comments: Math.round(aiPrediction.comments * commentMultiplier * mediaBonus) || Math.floor(baseReach * 0.05 * commentMultiplier * mediaBonus),
        shares: Math.round(aiPrediction.shares * shareMultiplier * mediaBonus) || Math.floor(baseReach * 0.03 * shareMultiplier * mediaBonus),
        reach: Math.round(aiPrediction.reach || baseReach * mediaBonus),
        engagementRate: aiPrediction.engagementRate || 0.03 * mediaBonus,
        score: aiPrediction.score || Math.floor(Math.random() * 40) + 30, // Fallback score between 30-70
        sentiment: aiPrediction.sentiment || 'neutral',
        recommendedTags: aiPrediction.recommendedTags || []
      };
      
      return prediction;
    } catch (error) {
      console.error("Error predicting engagement:", error);
      
      // Return fallback prediction if AI fails
      return this.generateFallbackPrediction(input);
    }
  },
  
  /**
   * Generate fallback predictions when AI service is unavailable
   * @param input Prediction input data
   * @returns Basic engagement predictions
   */
  generateFallbackPrediction(input: PredictionInput): EngagementPrediction {
    const baseReach = 300;
    const mediaBonus = input.mediaUrls && input.mediaUrls.length > 0 ? 1.4 : 1.0;
    
    // Generate some reasonable engagement metrics based on platform
    let likes = Math.floor(baseReach * 0.2 * mediaBonus);
    let comments = Math.floor(baseReach * 0.05 * mediaBonus);
    let shares = Math.floor(baseReach * 0.03 * mediaBonus);
    
    if (input.platform === 'instagram') {
      likes = Math.floor(likes * 1.5);
    } else if (input.platform === 'twitter') {
      shares = Math.floor(shares * 1.5);
    } else if (input.platform === 'linkedin') {
      comments = Math.floor(comments * 1.3);
    }
    
    // Analyze content for length and estimate sentiment
    const contentLength = input.content.length;
    let score = 50; // Default middle score
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    // Simple sentiment analysis based on keywords
    const positiveWords = ['amazing', 'great', 'excellent', 'happy', 'love', 'awesome', 'beautiful', 'success', 'best'];
    const negativeWords = ['bad', 'worst', 'terrible', 'hate', 'awful', 'horrible', 'problem', 'fail', 'disappointed'];
    
    const lowercaseContent = input.content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowercaseContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowercaseContent.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score += 15;
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score -= 15;
    }
    
    // Content length affects score
    const idealLength = input.platform === 'twitter' ? 180 : 300;
    if (contentLength > 5 && contentLength < idealLength) {
      score += 10;
    } else if (contentLength > idealLength * 1.5) {
      score -= 10;
    }
    
    // Media bonus
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      score += 10;
    }
    
    // Ensure score is within 0-100
    score = Math.max(0, Math.min(100, score));
    
    return {
      likes,
      comments,
      shares,
      reach: baseReach,
      engagementRate: (likes + comments + shares) / baseReach,
      score,
      sentiment,
      recommendedTags: []
    };
  }
};
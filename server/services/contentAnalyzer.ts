import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ContentAnalysisResult {
  sentiment: {
    label: 'positive' | 'negative' | 'neutral';
    score: number;
  };
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
  tones: {
    formal: number;
    informal: number;
    friendly: number;
    professional: number;
    casual: number;
  };
  language: {
    clarity: number;
    engagement: number;
    persuasiveness: number;
  };
  summary: {
    mood: string;
    suggestions: string[];
  };
  engagement: {
    predicted: number;
    reasons: string[];
  };
  appropriateness: {
    score: number;
    issues: string[];
  };
  keywords: string[];
}

interface AnalyzerOptions {
  platform?: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
  language?: string;
  audience?: string;
  purpose?: 'marketing' | 'informational' | 'engagement' | 'sales';
}

export const ContentAnalyzer = {
  /**
   * Analyze content using OpenAI's GPT-4 model
   * @param content - The content to analyze
   * @param options - Analysis options
   * @returns Analysis result
   */
  async analyzeContent(
    content: string, 
    options: AnalyzerOptions = {}
  ): Promise<ContentAnalysisResult> {
    try {
      // Create prompt based on options
      const platformContext = options.platform 
        ? `This content is intended for ${options.platform}.` 
        : "";
      
      const languageContext = options.language 
        ? `The target audience speaks ${options.language}.` 
        : "";
      
      const audienceContext = options.audience 
        ? `The target audience is ${options.audience}.` 
        : "";
      
      const purposeContext = options.purpose 
        ? `The purpose of this content is ${options.purpose}.` 
        : "";

      // Construct the system prompt
      const systemPrompt = `
        You are an expert social media content analyzer. Analyze the following content and provide detailed insights.
        ${platformContext} ${languageContext} ${audienceContext} ${purposeContext}
        
        Provide your analysis in the following JSON format:
        {
          "sentiment": {
            "label": "positive/negative/neutral",
            "score": 0-1
          },
          "emotions": {
            "joy": 0-1,
            "sadness": 0-1,
            "anger": 0-1,
            "fear": 0-1,
            "surprise": 0-1
          },
          "tones": {
            "formal": 0-1,
            "informal": 0-1,
            "friendly": 0-1,
            "professional": 0-1,
            "casual": 0-1
          },
          "language": {
            "clarity": 0-1,
            "engagement": 0-1,
            "persuasiveness": 0-1
          },
          "summary": {
            "mood": "one or two word description of the overall mood",
            "suggestions": ["1-3 specific suggestions to improve the content"]
          },
          "engagement": {
            "predicted": 0-1,
            "reasons": ["1-3 reasons for the predicted engagement level"]
          },
          "appropriateness": {
            "score": 0-1,
            "issues": ["any potential issues with the content, if any"]
          },
          "keywords": ["3-5 main keywords or themes from the content"]
        }
        
        Be extremely detailed and accurate in your analysis.
      `;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const apiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content }
        ],
        response_format: { type: "json_object" }
      });

      const responseContent = apiResponse.choices[0].message.content || '{}';
      const result = JSON.parse(responseContent);
      
      return result as ContentAnalysisResult;
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw new Error('Failed to analyze content');
    }
  },

  /**
   * Get content suggestions based on analysis
   * @param contentText - Original content
   * @param analysis - Content analysis result
   * @param options - Analysis options
   * @returns Suggested improvements
   */
  async getSuggestions(
    contentText: string,
    analysis: ContentAnalysisResult,
    options: AnalyzerOptions = {}
  ): Promise<{ improved: string; changes: string[] }> {
    try {
      const platformContext = options.platform 
        ? `This content is intended for ${options.platform}.` 
        : "";
      
      const audienceContext = options.audience 
        ? `The target audience is ${options.audience}.` 
        : "";

      // Analysis summary for context
      const analysisContext = `
        Current sentiment: ${analysis.sentiment.label} (${analysis.sentiment.score})
        Dominant emotions: ${Object.entries(analysis.emotions)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([emotion, score]) => `${emotion} (${score})`)
          .join(', ')}
        Current engagement prediction: ${analysis.engagement.predicted}
        Key issues identified: ${analysis.appropriateness.issues.join(', ') || 'None'}
      `;

      // Construct the system prompt for suggestions
      const systemPrompt = `
        You are an expert social media content optimizer. 
        ${platformContext} ${audienceContext}
        
        Based on the following content analysis:
        ${analysisContext}
        
        Improve the content to:
        1. Address any issues mentioned in the analysis
        2. Optimize for better engagement
        3. Enhance the clarity and impact
        4. Maintain the original message and intent
        5. Make it more appropriate for the target platform and audience
        
        Provide your response in JSON format:
        {
          "improved": "the improved content",
          "changes": ["list of 2-4 key changes made and why"]
        }
      `;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const suggestionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentText }
        ],
        response_format: { type: "json_object" }
      });

      const responseContent = suggestionResponse.choices[0].message.content || '{}';
      const result = JSON.parse(responseContent);
      
      return result as { improved: string; changes: string[] };
    } catch (error) {
      console.error('Error generating content suggestions:', error);
      throw new Error('Failed to generate content suggestions');
    }
  }
};
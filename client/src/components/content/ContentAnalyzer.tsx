import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface ContentAnalysis {
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

interface ContentSuggestion {
  improved: string;
  changes: string[];
}

export default function ContentAnalyzer() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<string | undefined>(undefined);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [suggestion, setSuggestion] = useState<ContentSuggestion | null>(null);
  const [activeTab, setActiveTab] = useState("content");

  const analyzeContent = async () => {
    if (!content.trim()) {
      toast({
        title: t("Error"),
        description: t("Please enter some content to analyze"),
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);
    setSuggestion(null);

    try {
      const result = await apiRequest("POST", "/api/content/analyze", {
        content,
        platform,
        language: localStorage.getItem("i18nextLng") || "en"
      });

      const analysisResult = await result.json();
      setAnalysis(analysisResult);
      setActiveTab("analysis");
    } catch (error) {
      console.error("Error analyzing content:", error);
      toast({
        title: t("Analysis failed"),
        description: t("Could not analyze the content. Please try again."),
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getSuggestions = async () => {
    if (!content.trim() || !analysis) {
      toast({
        title: t("Error"),
        description: t("Please analyze the content first"),
        variant: "destructive"
      });
      return;
    }

    setSuggesting(true);
    setSuggestion(null);

    try {
      const result = await apiRequest("POST", "/api/content/suggest", {
        content,
        analysis,
        platform
      });

      const suggestionResult = await result.json();
      setSuggestion(suggestionResult);
      setActiveTab("suggestions");
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast({
        title: t("Suggestion failed"),
        description: t("Could not generate suggestions. Please try again."),
        variant: "destructive"
      });
    } finally {
      setSuggesting(false);
    }
  };

  const adoptSuggestion = () => {
    if (suggestion?.improved) {
      setContent(suggestion.improved);
      setActiveTab("content");
      toast({
        title: t("Content updated"),
        description: t("The suggested content has been applied")
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">{t("contentAnalyzer.Content Mood Analyzer")}</h2>
        <p className="text-muted-foreground">{t("contentAnalyzer.Analyze the tone and mood of your content with AI")}</p>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">{t("contentAnalyzer.Platform")}</label>
            <select 
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={platform || ""}
              onChange={(e) => setPlatform(e.target.value || undefined)}
            >
              <option value="">{t("contentAnalyzer.General")}</option>
              <option value="twitter">{t("contentAnalyzer.Twitter")}</option>
              <option value="facebook">{t("contentAnalyzer.Facebook")}</option>
              <option value="instagram">{t("contentAnalyzer.Instagram")}</option>
              <option value="linkedin">{t("contentAnalyzer.LinkedIn")}</option>
            </select>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="content">{t("contentAnalyzer.Content")}</TabsTrigger>
          <TabsTrigger value="analysis" disabled={!analysis}>{t("contentAnalyzer.Analysis")}</TabsTrigger>
          <TabsTrigger value="suggestions" disabled={!suggestion}>{t("contentAnalyzer.Suggestions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("contentAnalyzer.Your Content")}</CardTitle>
              <CardDescription>
                {t("contentAnalyzer.Enter your content to analyze its mood, tone, and potential engagement")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t("contentAnalyzer.Type your content here...")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] mb-4"
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  onClick={analyzeContent} 
                  disabled={analyzing || !content.trim()}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("contentAnalyzer.analyzing")}
                    </>
                  ) : (
                    t("contentAnalyzer.Analyze Content")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("Sentiment & Emotions")}</CardTitle>
                  <CardDescription>
                    {t("Analysis of the emotional content of your text")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{t("Sentiment")}</span>
                      <span className="text-sm font-medium capitalize">
                        {t(analysis.sentiment.label)} ({Math.round(analysis.sentiment.score * 100)}%)
                      </span>
                    </div>
                    <Progress value={analysis.sentiment.score * 100} className="h-2" />
                  </div>
                  
                  <h4 className="font-medium mt-4">{t("Emotions")}</h4>
                  {Object.entries(analysis.emotions).map(([emotion, score]) => (
                    <div key={emotion}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{t(emotion)}</span>
                        <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
                      </div>
                      <Progress value={score * 100} className="h-2 mb-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("Tone & Style")}</CardTitle>
                  <CardDescription>
                    {t("Analysis of the tone and writing style")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(analysis.tones).map(([tone, score]) => (
                    <div key={tone}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{t(tone)}</span>
                        <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
                      </div>
                      <Progress value={score * 100} className="h-2 mb-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("Language Quality")}</CardTitle>
                  <CardDescription>
                    {t("Assessment of your content's language quality")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(analysis.language).map(([aspect, score]) => (
                    <div key={aspect}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{t(aspect)}</span>
                        <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
                      </div>
                      <Progress value={score * 100} className="h-2 mb-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("Engagement & Appropriateness")}</CardTitle>
                  <CardDescription>
                    {t("How engaging and appropriate your content is likely to be")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{t("Predicted Engagement")}</span>
                      <span className="text-sm font-medium">{Math.round(analysis.engagement.predicted * 100)}%</span>
                    </div>
                    <Progress value={analysis.engagement.predicted * 100} className="h-2 mb-4" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{t("Appropriateness")}</span>
                      <span className="text-sm font-medium">{Math.round(analysis.appropriateness.score * 100)}%</span>
                    </div>
                    <Progress value={analysis.appropriateness.score * 100} className="h-2 mb-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t("Summary")}</CardTitle>
                  <CardDescription>
                    {t("Overall mood and suggestions")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">{t("Overall Mood")}: <span className="capitalize">{analysis.summary.mood}</span></h4>
                    
                    <h4 className="font-medium mt-4 mb-2">{t("Keywords")}</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {analysis.keywords.map((keyword, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                    
                    <h4 className="font-medium mt-4 mb-2">{t("Suggestions")}</h4>
                    <ul className="list-disc list-inside">
                      {analysis.summary.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm mb-1">{suggestion}</li>
                      ))}
                    </ul>
                    
                    <h4 className="font-medium mt-4 mb-2">{t("Engagement Factors")}</h4>
                    <ul className="list-disc list-inside">
                      {analysis.engagement.reasons.map((reason, i) => (
                        <li key={i} className="text-sm mb-1">{reason}</li>
                      ))}
                    </ul>
                    
                    {analysis.appropriateness.issues.length > 0 && (
                      <>
                        <h4 className="font-medium mt-4 mb-2">{t("Potential Issues")}</h4>
                        <ul className="list-disc list-inside">
                          {analysis.appropriateness.issues.map((issue, i) => (
                            <li key={i} className="text-sm mb-1">{issue}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      onClick={getSuggestions} 
                      disabled={suggesting}
                    >
                      {suggesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("Generating...")}
                        </>
                      ) : (
                        t("Get Suggestions")
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {suggestion && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Improved Content")}</CardTitle>
                <CardDescription>
                  {t("AI-generated suggestions to improve your content")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">{t("Suggested Content")}</h4>
                  <p className="whitespace-pre-wrap">{suggestion.improved}</p>
                </div>
                
                <h4 className="font-medium">{t("Changes Made")}</h4>
                <ul className="list-disc list-inside">
                  {suggestion.changes.map((change, i) => (
                    <li key={i} className="mb-1">{change}</li>
                  ))}
                </ul>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("analysis")}
                  >
                    {t("Back to Analysis")}
                  </Button>
                  <Button onClick={adoptSuggestion}>
                    {t("Use This Content")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
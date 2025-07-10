import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUsageStats } from "@/hooks/useUsage";
import { AIContentGenerator } from "@/components/AIContentGenerator";
import { AIImageGenerator } from "@/components/AIImageGenerator";
import { Sparkles, Image, Zap, Brain, TrendingUp } from "lucide-react";

export default function AIWorkspace() {
  const { user } = useAuth();
  const { data: usage } = useUsageStats();
  const [activeTab, setActiveTab] = useState('content');

  // Mock usage data if not available
  const usageData = usage || {
    words_generated: 24567,
    words_limit: 50000,
    image_tokens: 156,
    image_limit: 500,
    video_minutes: 42,
    video_limit: 100
  };

  const handleContentGenerated = (content: string, wordCount: number) => {
    console.log('Content generated:', { content, wordCount });
    // Here you could save to a project, show in a modal, etc.
  };

  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    console.log('Image generated:', { imageUrl, prompt });
    // Here you could save to a project, show in a gallery, etc.
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                AI Workspace
              </h1>
              <p className="text-muted-foreground">
                Create amazing content and images with AI-powered tools
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {user?.subscription_plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </Badge>
              
              <Card className="p-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {usageData.words_generated.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      / {usageData.words_limit.toLocaleString()} words
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{usageData.image_tokens}</span>
                    <span className="text-muted-foreground">
                      / {usageData.image_limit} images
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Content Generator
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Image Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Stats Cards */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Words Used</span>
                      <span className="text-sm font-medium">
                        {Math.round((usageData.words_generated / usageData.words_limit) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((usageData.words_generated / usageData.words_limit) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Images Used</span>
                      <span className="text-sm font-medium">
                        {Math.round((usageData.image_tokens / usageData.image_limit) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((usageData.image_tokens / usageData.image_limit) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Content Generator */}
              <div className="lg:col-span-3">
                <AIContentGenerator 
                  onContentGenerated={handleContentGenerated}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Image Generator */}
              <div className="lg:col-span-3">
                <AIImageGenerator 
                  onImageGenerated={handleImageGenerated}
                />
              </div>

              {/* Tips Card */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Pro Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">Better Prompts</h4>
                      <p className="text-muted-foreground text-xs">
                        Be specific about colors, style, mood, and composition for better results.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Try Different Styles</h4>
                      <p className="text-muted-foreground text-xs">
                        Each style produces unique results. Experiment with different options.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Size Matters</h4>
                      <p className="text-muted-foreground text-xs">
                        Choose the right size for your use case - square for social, landscape for headers.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Save Your Favorites</h4>
                      <p className="text-muted-foreground text-xs">
                        Download and save prompts that work well for future reference.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
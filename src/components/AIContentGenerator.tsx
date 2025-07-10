import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

interface AIContentGeneratorProps {
  projectId?: string;
  onContentGenerated?: (content: string, wordCount: number) => void;
}

interface GenerationResponse {
  content: string;
  word_count: number;
  type: string;
  model_used: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const contentTypes = [
  { value: 'article', label: 'Blog Article', description: 'Long-form content with structure' },
  { value: 'social_post', label: 'Social Media Post', description: 'Short, engaging social content' },
  { value: 'video_script', label: 'Video Script', description: 'Script for video content' },
  { value: 'email', label: 'Email Newsletter', description: 'Email marketing content' },
  { value: 'seo_content', label: 'SEO Content', description: 'Search engine optimized content' }
];

const models = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
  { value: 'gpt-4', label: 'GPT-4', description: 'More creative and accurate' }
];

export function AIContentGenerator({ projectId, onContentGenerated }: AIContentGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('article');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [usage, setUsage] = useState<GenerationResponse['usage'] | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt to generate content.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiClient.generateContent({
        type: contentType,
        prompt: prompt.trim(),
        project_id: projectId,
        params: {
          model,
          temperature,
          maxTokens
        }
      }) as GenerationResponse;

      setGeneratedContent(response.content);
      setUsage(response.usage);
      
      if (onContentGenerated) {
        onContentGenerated(response.content, response.word_count);
      }

      toast({
        title: "Content generated!",
        description: `Generated ${response.word_count} words using ${response.model_used}`,
      });
    } catch (error: any) {
      console.error('Content generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate content",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const downloadContent = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `generated-content-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const selectedContentType = contentTypes.find(ct => ct.value === contentType);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Content Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content Type</label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContentType && (
              <p className="text-xs text-muted-foreground">{selectedContentType.description}</p>
            )}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <Textarea
              placeholder={`Describe what you want to create. For example: "Write a comprehensive guide about sustainable living practices for modern families"`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex flex-col">
                        <span>{m.label}</span>
                        <span className="text-xs text-muted-foreground">{m.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Creativity</label>
              <Select value={temperature.toString()} onValueChange={(v) => setTemperature(parseFloat(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.3">Low (0.3)</SelectItem>
                  <SelectItem value="0.7">Medium (0.7)</SelectItem>
                  <SelectItem value="1.0">High (1.0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Length</label>
              <Select value={maxTokens.toString()} onValueChange={(v) => setMaxTokens(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">Short (500 tokens)</SelectItem>
                  <SelectItem value="1000">Medium (1000 tokens)</SelectItem>
                  <SelectItem value="2000">Long (2000 tokens)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </div>
            ) : (
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Content</CardTitle>
              <div className="flex items-center gap-2">
                {usage && (
                  <Badge variant="secondary">
                    {usage.total_tokens} tokens used
                  </Badge>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadContent}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {generatedContent}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
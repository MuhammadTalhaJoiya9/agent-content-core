import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image, Download, RefreshCw, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

interface AIImageGeneratorProps {
  projectId?: string;
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
}

interface ImageGenerationResponse {
  image_url: string;
  prompt: string;
  original_prompt: string;
  style: string;
  model_used: string;
  size: string;
}

const imageStyles = [
  { value: 'natural', label: 'Natural', description: 'Realistic and natural looking' },
  { value: 'photographic', label: 'Photographic', description: 'High-quality photography style' },
  { value: 'digital_art', label: 'Digital Art', description: 'Digital artwork and illustrations' },
  { value: 'illustration', label: 'Illustration', description: 'Clean illustration style' },
  { value: 'abstract', label: 'Abstract', description: 'Abstract and creative interpretation' }
];

const imageSizes = [
  { value: '1024x1024', label: 'Square (1024x1024)', description: 'Perfect for social media' },
  { value: '1792x1024', label: 'Landscape (1792x1024)', description: 'Wide format' },
  { value: '1024x1792', label: 'Portrait (1024x1792)', description: 'Tall format' }
];

const imageQualities = [
  { value: 'standard', label: 'Standard', description: 'Good quality, faster generation' },
  { value: 'hd', label: 'HD', description: 'High quality, takes longer' }
];

export function AIImageGenerator({ projectId, onImageGenerated }: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('natural');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ImageGenerationResponse | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiClient.generateImage({
        prompt: prompt.trim(),
        style,
        project_id: projectId
      }) as ImageGenerationResponse;

      setGeneratedImage(response);
      
      if (onImageGenerated) {
        onImageGenerated(response.image_url, response.prompt);
      }

      toast({
        title: "Image generated!",
        description: `Created using ${response.model_used} in ${style} style`,
      });
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate image",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPromptToClipboard = () => {
    if (generatedImage) {
      navigator.clipboard.writeText(generatedImage.prompt);
      toast({
        title: "Prompt copied!",
        description: "Enhanced prompt copied to clipboard",
      });
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage.image_url);
      const blob = await response.blob();
      
      const element = document.createElement('a');
      element.href = URL.createObjectURL(blob);
      element.download = `ai-generated-image-${Date.now()}.png`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Download started",
        description: "Image is being downloaded",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the image",
        variant: "destructive"
      });
    }
  };

  const selectedStyle = imageStyles.find(s => s.value === style);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            AI Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Image Description</label>
            <Textarea
              placeholder="Describe the image you want to create. Be as detailed as possible. For example: 'A majestic mountain landscape at sunset with snow-capped peaks reflecting in a crystal clear lake'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Art Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageStyles.map((styleOption) => (
                  <SelectItem key={styleOption.value} value={styleOption.value}>
                    <div className="flex flex-col">
                      <span>{styleOption.label}</span>
                      <span className="text-xs text-muted-foreground">{styleOption.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStyle && (
              <p className="text-xs text-muted-foreground">{selectedStyle.description}</p>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Size</label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {imageSizes.map((sizeOption) => (
                    <SelectItem key={sizeOption.value} value={sizeOption.value}>
                      <div className="flex flex-col">
                        <span>{sizeOption.label}</span>
                        <span className="text-xs text-muted-foreground">{sizeOption.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quality</label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {imageQualities.map((qualityOption) => (
                    <SelectItem key={qualityOption.value} value={qualityOption.value}>
                      <div className="flex flex-col">
                        <span>{qualityOption.label}</span>
                        <span className="text-xs text-muted-foreground">{qualityOption.description}</span>
                      </div>
                    </SelectItem>
                  ))}
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
                Generating Image...
              </div>
            ) : (
              <div className="flex items-center">
                <Image className="h-4 w-4 mr-2" />
                Generate Image
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Image */}
      {generatedImage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Image</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {generatedImage.model_used}
                </Badge>
                <Badge variant="outline">
                  {generatedImage.size}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPromptToClipboard}
                    title="Copy enhanced prompt"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadImage}
                    title="Download image"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    title="Generate another image"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Display */}
            <div className="flex justify-center">
              <img
                src={generatedImage.image_url}
                alt={generatedImage.original_prompt}
                className="max-w-full h-auto rounded-lg shadow-lg border"
                style={{ maxHeight: '512px' }}
              />
            </div>
            
            {/* Prompt Info */}
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Original Prompt:</label>
                <p className="text-sm mt-1">{generatedImage.original_prompt}</p>
              </div>
              
              {generatedImage.prompt !== generatedImage.original_prompt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Enhanced Prompt:</label>
                  <p className="text-sm mt-1 text-muted-foreground">{generatedImage.prompt}</p>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Style: {generatedImage.style}</span>
                <span>•</span>
                <span>Size: {generatedImage.size}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
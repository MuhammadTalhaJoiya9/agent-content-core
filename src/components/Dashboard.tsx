import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useUsageStats, calculateUsagePercentage, getUsageStatusColor } from "@/hooks/useUsage";
import { 
  Sparkles, 
  Image, 
  Video, 
  Search, 
  ArrowRight,
  FileText,
  Clock,
  TrendingUp,
  MoreHorizontal,
  Eye
} from "lucide-react";

const quickStartItems = [
  {
    icon: Sparkles,
    title: "Create New Prompt",
    description: "Build AI prompts for any content type",
    color: "bg-purple-500",
    path: "/prompt-builder"
  },
  {
    icon: Image,
    title: "Generate Image",
    description: "Create stunning visuals with AI",
    color: "bg-blue-500",
    path: "/image-video"
  },
  {
    icon: Video,
    title: "Start Video Script",
    description: "Write engaging video content",
    color: "bg-green-500",
    path: "/content-generator"
  },
  {
    icon: Search,
    title: "Analyze SEO",
    description: "Optimize content for search engines",
    color: "bg-orange-500",
    path: "/seo-optimizer"
  }
];

const mockRecentProjects = [
  {
    id: "1",
    title: "Blog Post: AI Trends 2024",
    content_type: "article" as const,
    word_count: 1250,
    status: "completed" as const,
    updated_at: "2 hours ago"
  },
  {
    id: "2",
    title: "Social Media Campaign",
    content_type: "social_post" as const,
    word_count: 450,
    status: "in_progress" as const,
    updated_at: "5 hours ago"
  },
  {
    id: "3",
    title: "Product Demo Script",
    content_type: "video_script" as const,
    word_count: 800,
    status: "draft" as const,
    updated_at: "1 day ago"
  },
  {
    id: "4",
    title: "Email Newsletter",
    content_type: "email" as const,
    word_count: 600,
    status: "completed" as const,
    updated_at: "2 days ago"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'info';
    case 'draft': return 'secondary';
    default: return 'secondary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'draft': return 'Draft';
    default: return status;
  }
};

export function Dashboard() {
  const { user } = useAuth();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: usage, isLoading: usageLoading } = useUsageStats();

  // Mock usage data if not available from backend yet
  const usageData = usage || {
    words_generated: 24567,
    words_limit: 50000,
    image_tokens: 156,
    image_limit: 500,
    video_minutes: 42,
    video_limit: 100
  };

  const wordsPercentage = calculateUsagePercentage(usageData.words_generated, usageData.words_limit);
  const imagePercentage = calculateUsagePercentage(usageData.image_tokens, usageData.image_limit);
  const videoPercentage = calculateUsagePercentage(usageData.video_minutes, usageData.video_limit);

  return (
    <div className="flex-1 p-6 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.first_name || 'John'}! 👋
          </h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {user?.subscription_plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Ready to create amazing content? Let's get started with your AI-powered toolkit.
        </p>
      </div>

      {/* Quick Start */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStartItems.map((item, index) => (
            <Card key={index} className="group hover:shadow-glow transition-all duration-300 cursor-pointer animate-scale-in border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {item.description}
                </p>
                <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/10">
                  Get started
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {mockRecentProjects.map((project) => (
              <Card key={project.id} className="group hover:shadow-card transition-all duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="capitalize">{project.content_type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{project.word_count} words</span>
                          <span>•</span>
                          <span>{project.updated_at}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(project.status) as any} className="capitalize">
                        {getStatusText(project.status)}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Usage Statistics</h2>
          <p className="text-sm text-muted-foreground">Your current plan usage</p>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Words Generated</span>
                    <span className="text-sm text-muted-foreground">
                      {usageData.words_generated.toLocaleString()} / {usageData.words_limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={wordsPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(wordsPercentage)}% used this month
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Image Tokens</span>
                    <span className="text-sm text-muted-foreground">
                      {usageData.image_tokens} / {usageData.image_limit}
                    </span>
                  </div>
                  <Progress value={imagePercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(imagePercentage)}% used this month
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Video Minutes</span>
                    <span className="text-sm text-muted-foreground">
                      {usageData.video_minutes} / {usageData.video_limit}
                    </span>
                  </div>
                  <Progress value={videoPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(videoPercentage)}% used this month
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Detailed Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
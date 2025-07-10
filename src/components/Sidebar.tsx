import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Sparkles, 
  Palette, 
  Video, 
  Search, 
  Image, 
  Mic, 
  History, 
  Users, 
  Settings,
  Crown,
  Plus
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Sparkles, label: "Prompt Builder", path: "/prompt-builder" },
  { icon: Palette, label: "Brand Style", path: "/brand-style" },
  { icon: Sparkles, label: "Content Generator", path: "/content-generator" },
  { icon: Search, label: "SEO Optimizer", path: "/seo-optimizer" },
  { icon: Image, label: "Image & Video", path: "/image-video" },
  { icon: Mic, label: "Voiceover", path: "/voiceover" },
  { icon: History, label: "History", path: "/history" },
  { icon: Users, label: "Team Collaboration", path: "/team" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col bg-gradient-card border-r border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">AI Content Agent</h1>
            <p className="text-xs text-muted-foreground">Factory</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => (
          <Button
            key={index}
            variant={index === 0 ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-10",
              index === 0 && "bg-primary text-primary-foreground shadow-glow"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="font-medium">{item.label}</span>
          </Button>
        ))}
      </nav>

      {/* Upgrade Section */}
      <div className="p-4 space-y-4">
        <div className="bg-gradient-accent rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Unlock advanced features
          </p>
          <Button size="sm" className="w-full">
            Upgrade Now
          </Button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {user?.first_name?.[0] || 'J'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.first_name || 'John'} {user?.last_name || 'Doe'}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {user?.subscription_plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
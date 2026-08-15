"use client";

import { useState } from "react";
import { WhatsAppDirectSignalGenerator } from "./WhatsAppDirectSignalGenerator";
import { SignalGenerator } from "./SignalGenerator";
import { Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminSignalDashboard() {
  const [activeTab, setActiveTab] = useState<"direct" | "web">("direct");

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Mode Switcher */}
      <div className="flex items-center justify-center gap-2">
        <div className="bg-muted/80 p-1 rounded-lg border flex items-center gap-1 shadow-sm">
          <Button
            size="sm"
            variant={activeTab === "direct" ? "default" : "ghost"}
            onClick={() => setActiveTab("direct")}
            className={`h-8 text-xs font-bold transition-all ${
              activeTab === "direct" 
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" />
            1-Click Direct WhatsApp
          </Button>

          <Button
            size="sm"
            variant={activeTab === "web" ? "default" : "ghost"}
            onClick={() => setActiveTab("web")}
            className={`h-8 text-xs font-bold transition-all ${
              activeTab === "web" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="w-3.5 h-3.5 mr-1.5" />
            Web WhatsApp (Browser)
          </Button>
        </div>
      </div>

      {/* Render Selected Generator */}
      {activeTab === "direct" ? (
        <WhatsAppDirectSignalGenerator />
      ) : (
        <SignalGenerator />
      )}
    </div>
  );
}

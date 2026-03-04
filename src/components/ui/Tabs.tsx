"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div className={cn("flex gap-1 rounded-lg bg-card p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id);
            onChange?.(tab.id);
          }}
          className={cn(
            "relative rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === tab.id ? "text-foreground" : "text-muted hover:text-foreground/70"
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-md bg-accent/15 border border-accent/30"
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-border px-1.5 py-0.5 text-[10px]">
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

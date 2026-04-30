"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Suggestion {
  title: string;
  emoji: string;
  description: string;
  steps: string[];
  details: {
    difficulty: string;
    cost: string;
    duration: string;
    bestFor: string;
    location: string;
  };
  searchKeyword: string;
}

export function AISuggestionCard({
  suggestion,
  onFindEvents,
}: {
  suggestion: Suggestion;
  onFindEvents: (keyword: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const s = suggestion;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="text-4xl shrink-0">{s.emoji}</span>
        <div className="flex-1">
          <h3 className="font-display text-xl mb-2">{s.title}</h3>
          <p className="text-sm text-muted-foreground">{s.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{s.details.cost}</Badge>
        <Badge variant="outline">{s.details.duration}</Badge>
        <Badge variant="outline">{s.details.difficulty}</Badge>
        <Badge variant="outline">{s.details.bestFor}</Badge>
      </div>

      <div className="bg-accent/30 rounded-xl p-3 flex items-start gap-2">
        <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
        <span className="text-sm">{s.details.location}</span>
      </div>

      {expanded && (
        <div className="space-y-2 pt-1">
          <h4 className="font-medium text-sm">How to do it:</h4>
          <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
            {s.steps.map((step, index) => (
              <li key={index} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex gap-2 mt-auto pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="flex-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              How to do it
            </>
          )}
        </Button>
        <Button
          size="sm"
          onClick={() => onFindEvents(s.searchKeyword)}
          className="flex-1"
        >
          <Search className="w-4 h-4" />
          Find Events
        </Button>
      </div>
    </div>
  );
}

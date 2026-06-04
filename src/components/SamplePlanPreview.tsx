import { Sparkles, Clock, MapPin } from "lucide-react";

/**
 * Static preview of what an optimized plan looks like — used on the
 * anonymous home so first-time visitors see the output before committing
 * to sign up.
 */
const SAMPLE_STOPS = [
  {
    order: 1,
    title: "Morning coffee at Pilot Coffee Roasters",
    time: "Sat, 9:30 AM",
    venue: "King St W, Toronto",
    note: "Walk-in, no booking needed",
  },
  {
    order: 2,
    title: "Indoor bouldering at Basecamp Climbing",
    time: "Sat, 11:00 AM",
    venue: "15 min subway from previous stop",
    note: "Beginner-friendly day pass",
  },
  {
    order: 3,
    title: "Live jazz at The Rex",
    time: "Sat, 8:00 PM",
    venue: "Queen St W",
    note: "Free cover, food + drinks",
  },
];

export function SamplePlanPreview() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-4">
        <Sparkles className="w-4 h-4" />
        Sample plan — &ldquo;A chill Saturday in Toronto&rdquo;
      </div>
      <div className="space-y-0">
        {SAMPLE_STOPS.map((stop, i) => (
          <div key={stop.order} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-sm font-semibold shrink-0">
                {stop.order}
              </div>
              {i < SAMPLE_STOPS.length - 1 && (
                <div className="w-0.5 flex-1 min-h-[32px] bg-gradient-to-b from-primary to-primary/20 mt-1" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="font-medium text-sm leading-tight">{stop.title}</p>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{stop.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  <span>{stop.venue}</span>
                </div>
                <p className="text-foreground/60 italic mt-1">{stop.note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span>Estimated time: ~6 hours</span>
        <span>Cost: ~$45</span>
      </div>
    </div>
  );
}

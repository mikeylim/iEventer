"use client";

import { useId, useState } from "react";
import {
	ChevronDown,
	ChevronUp,
	Clock3,
	MapPin,
	Search,
	Sparkles,
	WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
	const stepsId = useId();
	const s = suggestion;

	return (
		<article
			aria-label={`AI idea: ${s.title}`}
			className="flex flex-col gap-4 overflow-hidden rounded-lg border border-primary/25 bg-accent/10 p-5 shadow-sm transition-[border-color,box-shadow] duration-300 animate-fade-in hover:border-primary/45 hover:shadow-md">
			<div className="flex items-center justify-between gap-3">
				<span className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-background/80 px-2 py-1 text-xs font-semibold text-foreground">
					<Sparkles className="size-3.5 text-primary" aria-hidden="true" />
					AI idea
				</span>
				<span className="text-xs font-medium text-muted-foreground">
					Generated for you
				</span>
			</div>

			<div className="flex items-start gap-3">
				<span
					aria-hidden="true"
					className="flex size-12 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-background text-3xl shadow-sm">
					{s.emoji}
				</span>
				<div className="flex-1">
					<h3 className="font-display text-xl mb-2">{s.title}</h3>
					<p className="text-sm text-muted-foreground">{s.description}</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2" aria-label="Idea details">
				<div className="rounded-md border border-primary/15 bg-background/70 px-3 py-2">
					<span className="mb-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
						<WalletCards className="size-3.5" aria-hidden="true" />
						Cost
					</span>
					<span className="text-sm font-medium">{s.details.cost}</span>
				</div>
				<div className="rounded-md border border-primary/15 bg-background/70 px-3 py-2">
					<span className="mb-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
						<Clock3 className="size-3.5" aria-hidden="true" />
						Duration
					</span>
					<span className="text-sm font-medium">{s.details.duration}</span>
				</div>
			</div>

			<div className="flex items-start gap-2 rounded-md border border-primary/10 bg-background/60 p-3">
				<MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
				<span className="text-sm">{s.details.location}</span>
			</div>

			{expanded && (
				<div id={stepsId} className="space-y-2 pt-1">
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
					aria-expanded={expanded}
					aria-controls={stepsId}
					className="flex-1">
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
				<Button size="sm" onClick={() => onFindEvents(s.searchKeyword)} className="flex-1">
					<Search className="w-4 h-4" />
					Find Events
				</Button>
			</div>
		</article>
	);
}

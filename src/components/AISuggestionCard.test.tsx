import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AISuggestionCard, type Suggestion } from "./AISuggestionCard";

function makeSuggestion(overrides: Partial<Suggestion> = {}): Suggestion {
  return {
    title: "Try Indoor Bouldering",
    emoji: "🧗",
    description: "Climb walls, meet people, get strong.",
    steps: [
      "Find a nearby climbing gym",
      "Rent shoes at the front desk",
      "Start with beginner routes",
    ],
    details: {
      difficulty: "Beginner",
      cost: "$20-30",
      duration: "2 hours",
      bestFor: "Solo or small groups",
      location: "Brooklyn Boulders, Gowanus",
    },
    searchKeyword: "bouldering",
    ...overrides,
  };
}

describe("AISuggestionCard", () => {
  it("renders the title, emoji, and description", () => {
    render(<AISuggestionCard suggestion={makeSuggestion()} onFindEvents={() => {}} />);
    expect(screen.getByText("AI idea")).toBeInTheDocument();
    expect(screen.getByText("Try Indoor Bouldering")).toBeInTheDocument();
    expect(screen.getByText("🧗")).toBeInTheDocument();
    expect(screen.getByText(/Climb walls/)).toBeInTheDocument();
  });

  it("shows only cost and duration in the compact details", () => {
    render(<AISuggestionCard suggestion={makeSuggestion()} onFindEvents={() => {}} />);
    expect(screen.getByText("$20-30")).toBeInTheDocument();
    expect(screen.getByText("2 hours")).toBeInTheDocument();
    expect(screen.queryByText("Beginner")).not.toBeInTheDocument();
    expect(screen.queryByText("Solo or small groups")).not.toBeInTheDocument();
  });

  it("starts collapsed: steps are not visible by default", () => {
    render(<AISuggestionCard suggestion={makeSuggestion()} onFindEvents={() => {}} />);
    expect(screen.queryByText(/How to do it:/)).not.toBeInTheDocument();
    expect(screen.queryByText("Rent shoes at the front desk")).not.toBeInTheDocument();
  });

  it("expands to show the step list when 'How to do it' is clicked", async () => {
    const user = userEvent.setup();
    render(<AISuggestionCard suggestion={makeSuggestion()} onFindEvents={() => {}} />);
    const disclosure = screen.getByRole("button", { name: /how to do it/i });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");

    await user.click(disclosure);

    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/How to do it:/)).toBeInTheDocument();
    expect(screen.getByText("Rent shoes at the front desk")).toBeInTheDocument();
    expect(document.getElementById(disclosure.getAttribute("aria-controls")!)).toBeInTheDocument();
  });

  it("fires onFindEvents with the search keyword when the button is clicked", async () => {
    const user = userEvent.setup();
    const onFind = vi.fn();
    render(
      <AISuggestionCard suggestion={makeSuggestion()} onFindEvents={onFind} />
    );
    await user.click(screen.getByRole("button", { name: /find events/i }));
    expect(onFind).toHaveBeenCalledWith("bouldering");
  });
});

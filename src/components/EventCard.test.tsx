import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventCard, type EventItem } from "./EventCard";

function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: "evt-1",
    name: "Toronto Jazz Festival",
    description: "Live jazz under the stars",
    url: "https://example.com/jazz",
    start: "2026-06-15T18:00:00Z",
    category: "Music",
    venue: { name: "Harbourfront", city: "Toronto", address: "Toronto, Canada" },
    isFree: false,
    logo: null,
    ...overrides,
  };
}

describe("EventCard", () => {
  it("renders the title, venue, and category", () => {
    render(<EventCard event={makeEvent()} onAddToPlan={() => {}} isInPlan={false} />);
    expect(screen.getByText("Toronto Jazz Festival")).toBeInTheDocument();
    expect(screen.getByText(/Harbourfront/)).toBeInTheDocument();
    expect(screen.getByText("Music")).toBeInTheDocument();
  });

  it("shows the FREE badge when isFree is true", () => {
    render(
      <EventCard
        event={makeEvent({ isFree: true })}
        onAddToPlan={() => {}}
        isInPlan={false}
      />
    );
    expect(screen.getByText("FREE")).toBeInTheDocument();
  });

  it("shows Paid badge when isFree is false", () => {
    render(<EventCard event={makeEvent()} onAddToPlan={() => {}} isInPlan={false} />);
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("View Event link points at the event URL", () => {
    render(<EventCard event={makeEvent()} onAddToPlan={() => {}} isInPlan={false} />);
    const link = screen.getByRole("link", { name: /view event/i });
    expect(link).toHaveAttribute("href", "https://example.com/jazz");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("fires onAddToPlan when the Add button is clicked", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<EventCard event={makeEvent()} onAddToPlan={onAdd} isInPlan={false} />);
    await user.click(screen.getByRole("button", { name: /add to plan/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0].id).toBe("evt-1");
  });

  it("disables the Add button and shows Added state when already in plan", () => {
    render(<EventCard event={makeEvent()} onAddToPlan={() => {}} isInPlan={true} />);
    const btn = screen.getByRole("button", { name: /added/i });
    expect(btn).toBeDisabled();
  });
});

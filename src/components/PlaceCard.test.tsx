import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaceCard } from "./PlaceCard";
import type { DiscoveryItem } from "@/lib/discovery";

const place: DiscoveryItem = {
  id: "geoapify:high-park",
  sourceId: "high-park",
  kind: "place",
  sourceProvider: "geoapify",
  name: "High Park",
  description: "Park",
  url: "https://www.openstreetmap.org",
  start: "",
  category: "Park",
  venue: {
    name: "High Park",
    city: "Toronto",
    address: "1873 Bloor Street West, Toronto",
  },
  isFree: false,
  logo: null,
  distanceMeters: 1400,
  setting: "outdoor",
  weatherNote: "Forecast looks suitable for this outdoor stop.",
};

describe("PlaceCard", () => {
  it("renders verified place details and weather context", () => {
    render(<PlaceCard item={place} onAddToPlan={() => {}} isInPlan={false} />);

    expect(screen.getByText("High Park")).toBeInTheDocument();
    expect(screen.getByText("1.4 km away")).toBeInTheDocument();
    expect(screen.getByText(/forecast looks suitable/i)).toBeInTheDocument();
    expect(screen.getByText("Geoapify")).toBeInTheDocument();
  });

  it("adds the place to the plan", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<PlaceCard item={place} onAddToPlan={onAdd} isInPlan={false} />);

    await user.click(screen.getByRole("button", { name: /add to plan/i }));
    expect(onAdd).toHaveBeenCalledWith(place);
  });
});

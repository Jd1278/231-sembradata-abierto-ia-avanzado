import { describe, it, expect } from "vitest";
import { MapLegend } from "../../src/components/sembradata/dashboard/MapLegend";
import { setup } from "./test-utils";

describe("MapLegend", () => {
  it("renderiza los tres niveles de riesgo", () => {
    const { getByText } = setup(<MapLegend />);
    expect(getByText("Bajo")).toBeInTheDocument();
    expect(getByText("Medio")).toBeInTheDocument();
    expect(getByText("Alto")).toBeInTheDocument();
  });

  it("tiene data-testid", () => {
    const { getByTestId } = setup(<MapLegend />);
    expect(getByTestId("map-legend")).toBeInTheDocument();
  });

  it("renderiza tres dots con las clases de riesgo", () => {
    const { container } = setup(<MapLegend />);
    const dots = container.querySelectorAll("span.h-2.w-2.rounded-full");
    expect(dots.length).toBe(3);
  });
});

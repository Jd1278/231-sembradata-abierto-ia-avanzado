import { describe, it, expect } from "vitest";
import { MapPin } from "lucide-react";
import { FilterBlock } from "../../src/components/sembradata/dashboard/FilterBlock";
import { setup } from "./test-utils";

describe("FilterBlock", () => {
  it("renderiza el label y el contenido", () => {
    const { getByText } = setup(
      <FilterBlock label="Municipio" icon={<MapPin className="h-4 w-4" />}>
        <div>Contenido del filtro</div>
      </FilterBlock>,
    );
    expect(getByText("Municipio")).toBeInTheDocument();
    expect(getByText("Contenido del filtro")).toBeInTheDocument();
  });

  it("renderiza sin icono", () => {
    const { container } = setup(
      <FilterBlock label="Año">
        <span>2024</span>
      </FilterBlock>,
    );
    expect(container.querySelector("label")).toHaveTextContent("Año");
    expect(container.querySelector("label")!.querySelector("svg")).toBeNull();
  });

  it("renderiza children complejos", () => {
    const { getByTestId } = setup(
      <FilterBlock label="Prueba">
        <div data-testid="child">child</div>
      </FilterBlock>,
    );
    expect(getByTestId("child")).toHaveTextContent("child");
  });
});

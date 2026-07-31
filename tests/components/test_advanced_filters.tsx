import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import {
  AdvancedFilters,
  type AdvancedFilterValues,
} from "../../src/components/sembradata/AdvancedFilters";
import { setup } from "./test-utils";

const DEFAULT: AdvancedFilterValues = {
  altitudeRange: [0, 4000],
  tempRange: [10, 35],
  precipRange: [0, 4000],
  soilType: "all",
};

function FilterContainer({
  initial = DEFAULT,
  onChange,
}: {
  initial?: AdvancedFilterValues;
  onChange?: (v: AdvancedFilterValues) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <AdvancedFilters
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

describe("AdvancedFilters", () => {
  it("renderiza colapsado por defecto", () => {
    const { getByText } = setup(<FilterContainer />);
    expect(getByText("Filtros avanzados")).toBeInTheDocument();
  });

  it("expande al hacer clic en el encabezado", async () => {
    const { getByText, user } = setup(<FilterContainer />);
    await user.click(getByText("Filtros avanzados"));
    expect(getByText("Altitud")).toBeInTheDocument();
    expect(getByText("Temperatura promedio")).toBeInTheDocument();
    expect(getByText("Precipitación anual")).toBeInTheDocument();
  });

  it("muestra las opciones de tipo de suelo al expandir", async () => {
    const { getByText, user } = setup(<FilterContainer />);
    await user.click(getByText("Filtros avanzados"));
    expect(getByText("Todos")).toBeInTheDocument();
    expect(getByText("Arcilla")).toBeInTheDocument();
    expect(getByText("Limo")).toBeInTheDocument();
    expect(getByText("Arena")).toBeInTheDocument();
    expect(getByText("Franco")).toBeInTheDocument();
  });

  it("cambia el tipo de suelo al hacer clic", async () => {
    const onChange = vi.fn();
    const { getByText, user } = setup(<FilterContainer onChange={onChange} />);
    await user.click(getByText("Filtros avanzados"));
    await user.click(getByText("Arcilla"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ soilType: "arcilla" }));
  });

  it("no muestra el botón limpiar filtros sin cambios", async () => {
    const { getByText, queryByText, user } = setup(<FilterContainer />);
    await user.click(getByText("Filtros avanzados"));
    expect(queryByText("Limpiar filtros")).not.toBeInTheDocument();
  });

  it("muestra el botón limpiar filtros tras cambiar", async () => {
    const { getByText, user } = setup(
      <FilterContainer initial={{ ...DEFAULT, soilType: "arena" }} />,
    );
    await user.click(getByText("Filtros avanzados"));
    expect(getByText("Limpiar filtros")).toBeInTheDocument();
  });

  it("resetea al valor por defecto al hacer clic en limpiar", async () => {
    const onChange = vi.fn();
    const { getByText, user } = setup(
      <FilterContainer initial={{ ...DEFAULT, soilType: "franco" }} onChange={onChange} />,
    );
    await user.click(getByText("Filtros avanzados"));
    await user.click(getByText("Limpiar filtros"));
    expect(onChange).toHaveBeenCalledWith(DEFAULT);
  });
});

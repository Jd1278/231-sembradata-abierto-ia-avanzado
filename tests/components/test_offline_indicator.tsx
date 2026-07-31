import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OfflineIndicator } from "../../src/components/sembradata/OfflineIndicator";
import { setup } from "./test-utils";

describe("OfflineIndicator", () => {
  beforeEach(() => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no renderiza nada cuando está online", () => {
    const { container } = setup(<OfflineIndicator />);
    expect(container.innerHTML).toBe("");
  });

  it("renderiza el mensaje offline cuando no hay conexión", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const { getByText } = setup(<OfflineIndicator />);
    expect(getByText("Sin conexión — mostrando datos guardados")).toBeInTheDocument();
  });

  it("tiene el icono WifiOff cuando está offline", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const { container } = setup(<OfflineIndicator />);
    expect(container.querySelector(".lucide-wifi-off")).toBeInTheDocument();
  });
});

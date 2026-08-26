import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConnectivityBanner } from "../../src/components/sembradata/ConnectivityBanner";
import { OfflineIndicator } from "../../src/components/sembradata/OfflineIndicator";
import { setup, fireEvent, waitFor } from "./test-utils";

describe("ConnectivityBanner & Network Status Management", () => {
  beforeEach(() => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no renderiza nada cuando el navegador está online", () => {
    const { container } = setup(<ConnectivityBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("renderiza el mensaje estricto de requerimiento de conexión cuando no hay red", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const { getByText, getByRole } = setup(<ConnectivityBanner />);
    expect(getByRole("alert")).toBeInTheDocument();
    expect(
      getByText(
        /Se requiere conexión a internet para consultar datos climáticos y generar predicciones/i,
      ),
    ).toBeInTheDocument();
  });

  it("renderiza el botón de reintentar conexión con icono WifiOff", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const { container, getByRole } = setup(<ConnectivityBanner />);
    expect(container.querySelector(".lucide-wifi-off")).toBeInTheDocument();
    expect(getByRole("button", { name: /Reintentar conexión/i })).toBeInTheDocument();
  });

  it("permite invocar onRetry al pulsar el botón cuando se restablece la conexión", async () => {
    const onLineSpy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const onRetry = vi.fn();
    const { getByRole } = setup(<ConnectivityBanner onRetry={onRetry} />);

    // Mock fetch for favicon check
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response);

    // Simulate network being restored
    onLineSpy.mockReturnValue(true);

    const button = getByRole("button", { name: /Reintentar conexión/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalled();
    });
  });

  it("OfflineIndicator reenvía transparentemente a ConnectivityBanner", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const { getByText } = setup(<OfflineIndicator />);
    expect(
      getByText(/Se requiere conexión a internet para consultar datos climáticos/i),
    ).toBeInTheDocument();
  });
});

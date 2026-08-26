import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ChatbotPanel } from "../../src/components/sembradata/ChatbotPanel";
import { setup, fireEvent, waitFor } from "./test-utils";

describe("ChatbotPanel Component Tests", () => {
  beforeEach(() => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the toggle button and opens chat panel on click", () => {
    const { getByLabelText, getByText } = setup(<ChatbotPanel municipio="San Gil" crop="cacao" />);
    const toggleBtn = getByLabelText(/Abrir chat/i);
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(getByText(/Asistente SembraData/i)).toBeInTheDocument();
    expect(getByText(/¡Hola! Soy el asistente agroclimático/i)).toBeInTheDocument();
  });

  it("shows offline banner and disables input when disconnected", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const { getByLabelText, getByText, getByPlaceholderText } = setup(
      <ChatbotPanel municipio="San Gil" crop="cacao" />,
    );

    const toggleBtn = getByLabelText(/Abrir chat/i);
    fireEvent.click(toggleBtn);

    expect(
      getByText(/Se requiere conexión a internet para consultar al asistente/i),
    ).toBeInTheDocument();

    const input = getByPlaceholderText(/Sin conexión a internet/i);
    expect(input).toBeDisabled();
  });

  it("sends message and renders response with metadata badges and verified claims", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        answer: "Para San Gil, el cacao es una excelente opción debido a su temperatura.",
        summary: "San Gil tiene clima propicio.",
        claims: [
          {
            text: "Temperatura actual de 24°C.",
            claimType: "forecast",
            source: "Open-Meteo",
            value: 24,
            unit: "°C",
          },
        ],
        intent: "CROP_RECOMMENDATION",
        provider: "groq",
        degraded: false,
        requestId: "test-req-1",
        latencyMs: 850,
        data: {
          municipio: "San Gil",
          cultivo: "cacao",
          lat: 6.55,
          lon: -73.13,
          sources: ["Open-Meteo", "SoilGrids"],
        },
      }),
    } as unknown as Response);

    const { getByLabelText, getByPlaceholderText, getByText } = setup(
      <ChatbotPanel municipio="San Gil" crop="cacao" />,
    );

    fireEvent.click(getByLabelText(/Abrir chat/i));

    const input = getByPlaceholderText(/Pregunta sobre cultivos/i);
    fireEvent.change(input, { target: { value: "¿Qué cultivo es viable?" } });

    const sendButton = document.querySelector('button[type="submit"]');
    if (sendButton) fireEvent.click(sendButton);

    await waitFor(() => {
      expect(getByText(/1 afirmación\(es\) verificada\(s\)/i)).toBeInTheDocument();
      expect(getByText(/Open-Meteo/i)).toBeInTheDocument();
      expect(getByText(/SoilGrids/i)).toBeInTheDocument();
    });

    // Expand claims accordion
    const accordionBtn = getByText(/1 afirmación\(es\) verificada\(s\)/i);
    fireEvent.click(accordionBtn);

    expect(getByText(/Temperatura actual de 24°C/i)).toBeInTheDocument();
  });

  it("displays error and allows retry on network failure", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    const { getByLabelText, getByPlaceholderText, getByText } = setup(
      <ChatbotPanel municipio="San Gil" crop="cacao" />,
    );

    fireEvent.click(getByLabelText(/Abrir chat/i));

    const input = getByPlaceholderText(/Pregunta sobre cultivos/i);
    fireEvent.change(input, { target: { value: "¿Cuáles son los riesgos?" } });

    const sendButton = document.querySelector('button[type="submit"]');
    if (sendButton) fireEvent.click(sendButton);

    await waitFor(() => {
      expect(getByText(/No se pudo conectar con el servidor de IA/i)).toBeInTheDocument();
      expect(getByText(/Reintentar/i)).toBeInTheDocument();
    });
  });
});

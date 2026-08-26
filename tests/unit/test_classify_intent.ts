import { describe, it, expect } from "vitest";

// Re-implement classifyIntent locally for testing (mirrors supabase/functions/chat/shared.ts)
type Intent =
  | "CROP_RECOMMENDATION"
  | "CROP_RISK_ANALYSIS"
  | "CROP_REQUIREMENTS"
  | "GENERAL"
  | "GREETING"
  | "UNKNOWN";

function classifyIntent(msg: string): Intent {
  const ascii = msg
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\ufffd]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(hola|buenos dias|buenas tardes|buenas noches)/.test(ascii)) return "GREETING";

  if (
    /recomiend/.test(ascii) ||
    /viabilidad/.test(ascii) ||
    /viable/.test(ascii) ||
    /(que|cuál|cual|mejor|que cultivo|cual cultivo).{0,20}cultivo/.test(ascii) ||
    /cultivo.{0,20}(que|cuál|cual|mejor)/.test(ascii) ||
    (/cultivo/.test(ascii) && /conviene|recomienda|siembra|produce/.test(ascii)) ||
    /apto para/.test(ascii) ||
    /funciona en/.test(ascii)
  )
    return "CROP_RECOMMENDATION";

  if (
    /riesgo/.test(ascii) ||
    /peligro/.test(ascii) ||
    /exito/.test(ascii) ||
    /éxito/.test(ascii) ||
    /probabilidad/.test(ascii) ||
    /tiene exito/.test(ascii) ||
    /saldrá/.test(ascii) ||
    /saldra/.test(ascii)
  )
    return "CROP_RISK_ANALYSIS";

  if (
    /requisito/.test(ascii) ||
    /como (sembrar|plantar|cultivar)/.test(ascii) ||
    /pasos para sembrar/.test(ascii) ||
    /\bsembrar\b/.test(ascii) ||
    /\bplantar\b/.test(ascii) ||
    /\bcultivar\b/.test(ascii) ||
    /ciclo de vida/.test(ascii) ||
    /cuidados/.test(ascii) ||
    /cosecha/.test(ascii)
  )
    return "CROP_REQUIREMENTS";

  return "UNKNOWN";
}

describe("classifyIntent", () => {
  describe("GREETING", () => {
    it("detects hola", () => expect(classifyIntent("Hola")).toBe("GREETING"));
    it("detects buenos dias", () => expect(classifyIntent("Buenos dias")).toBe("GREETING"));
    it("detects buenas tardes", () => expect(classifyIntent("Buenas tardes")).toBe("GREETING"));
    it("detects buenas noches", () => expect(classifyIntent("Buenas noches")).toBe("GREETING"));
  });

  describe("CROP_RECOMMENDATION", () => {
    it("detects recomienda", () =>
      expect(classifyIntent("Recomienda un cultivo")).toBe("CROP_RECOMMENDATION"));
    it("detects viable", () =>
      expect(classifyIntent("Que cultivo es viable en San Gil")).toBe("CROP_RECOMMENDATION"));
    it("detects viabilidad", () =>
      expect(classifyIntent("Viabilidad del cacao")).toBe("CROP_RECOMMENDATION"));
    it("detects que cultivo + conviene", () =>
      expect(classifyIntent("Que cultivo conviene en Bucaramanga")).toBe("CROP_RECOMMENDATION"));
    it("detects mejor cultivo", () =>
      expect(classifyIntent("Cual es el mejor cultivo para la zona")).toBe("CROP_RECOMMENDATION"));
    it("detects apto para", () =>
      expect(classifyIntent("El cafe es apto para esta region")).toBe("CROP_RECOMMENDATION"));
    it("detects funciona en", () =>
      expect(classifyIntent("Que funciona en San Gil")).toBe("CROP_RECOMMENDATION"));
    it("detects cultivo + siembra", () =>
      expect(classifyIntent("Que cultivo se siembra en marzo")).toBe("CROP_RECOMMENDATION"));
    it("detects cultivo + produce", () =>
      expect(classifyIntent("Que cultivo produce mas en Santander")).toBe("CROP_RECOMMENDATION"));
  });

  describe("CROP_RISK_ANALYSIS", () => {
    it("detects riesgo", () =>
      expect(classifyIntent("Cuales son los riesgos del cacao")).toBe("CROP_RISK_ANALYSIS"));
    it("detects peligro", () =>
      expect(classifyIntent("Hay peligro de heladas?")).toBe("CROP_RISK_ANALYSIS"));
    it("detects exito", () =>
      expect(classifyIntent("Tiene exito el cafe en esta zona")).toBe("CROP_RISK_ANALYSIS"));
    it("detects probabilidad", () =>
      expect(classifyIntent("Cual es la probabilidad de exito")).toBe("CROP_RISK_ANALYSIS"));
    it("detects saldra", () =>
      expect(classifyIntent("Saldra bien el cacao aca?")).toBe("CROP_RISK_ANALYSIS"));
  });

  describe("CROP_REQUIREMENTS", () => {
    it("detects sembrar", () =>
      expect(classifyIntent("Como sembrar cafe")).toBe("CROP_REQUIREMENTS"));
    it("detects plantar", () =>
      expect(classifyIntent("Como plantar cacao")).toBe("CROP_REQUIREMENTS"));
    it("detects cultivar", () =>
      expect(classifyIntent("Como cultivar granadilla")).toBe("CROP_REQUIREMENTS"));
    it("detects requisitos", () =>
      expect(classifyIntent("Requisitos para sembrar cafe")).toBe("CROP_REQUIREMENTS"));
    it("detects cuidados", () =>
      expect(classifyIntent("Cuidados del cacao")).toBe("CROP_REQUIREMENTS"));
    it("detects cosecha", () =>
      expect(classifyIntent("Cuando es la cosecha del cafe")).toBe("CROP_REQUIREMENTS"));
    it("detects ciclo de vida", () =>
      expect(classifyIntent("Ciclo de vida de la granadilla")).toBe("CROP_REQUIREMENTS"));
    it("detects pasos para sembrar", () =>
      expect(classifyIntent("Pasos para sembrar cafe")).toBe("CROP_REQUIREMENTS"));
  });

  describe("UNKNOWN (fallback)", () => {
    it("returns UNKNOWN for random text", () =>
      expect(classifyIntent("bla bla bla")).toBe("UNKNOWN"));
    it("returns UNKNOWN for single word", () => expect(classifyIntent("hello")).toBe("UNKNOWN"));
    it("returns UNKNOWN for numbers", () => expect(classifyIntent("123 456")).toBe("UNKNOWN"));
  });

  describe("edge cases", () => {
    it("handles accented characters", () =>
      expect(classifyIntent("Café es viable?")).toBe("CROP_RECOMMENDATION"));
    it("handles mixed case", () =>
      expect(classifyIntent("QUIERO SABER SI ES VIABLE")).toBe("CROP_RECOMMENDATION"));
    it("handles extra spaces", () => expect(classifyIntent("  hola   mundo  ")).toBe("GREETING"));
    it("handles empty string", () => expect(classifyIntent("")).toBe("UNKNOWN"));
  });
});

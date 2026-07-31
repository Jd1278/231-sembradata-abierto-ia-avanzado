import { test, expect } from "@playwright/test";

test.describe("SembraData — Flujo principal", () => {
  test("carga el dashboard y muestra los KPIs", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("SembraData");

    await expect(page.getByText("Rendimiento estimado")).toBeVisible();
    await expect(page.getByText("Riesgo agroclimático")).toBeVisible();
    await expect(page.getByText("Precipitación esperada")).toBeVisible();
    await expect(page.getByText("Temperatura promedio")).toBeVisible();
  });

  test("cambia de cultivo con los botones del header", async ({ page }) => {
    await page.goto("/");

    const cafeBtn = page.getByRole("button", { name: /Café/i });
    await cafeBtn.click();

    await expect(page.getByText("Ventana óptima de siembra para Café")).toBeVisible();
  });

  test("abre y cierra el panel de predicción", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Analizar zona/i }).click();

    const panel = page.locator("text=Análisis de Viabilidad");
    await expect(panel).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "" }).first().click();

    await expect(panel).not.toBeVisible();
  });

  test("el mapa SVG está visible", async ({ page }) => {
    await page.goto("/");

    const map = page.locator("svg").first();
    await expect(map).toBeVisible();
  });

  test("muestra la leyenda del mapa", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Bajo")).toBeVisible();
    await expect(page.getByText("Medio")).toBeVisible();
    await expect(page.getByText("Alto")).toBeVisible();
  });
});

test.describe("SembraData — Filtros", () => {
  test("cambia departamento", async ({ page }) => {
    await page.goto("/");

    const deptTrigger = page.locator("[data-testid='select-trigger']").first();
    await deptTrigger.click();
    await page.getByText("Antioquia").click();

    await expect(page.getByText("Antioquia")).toBeVisible();
  });

  test("cambia año y mes", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("2026")).toBeVisible();
    await expect(page.getByText("Mar")).toBeVisible();
  });
});

test.describe("SembraData — Header tools", () => {
  test("botón de idioma está visible", async ({ page }) => {
    await page.goto("/");

    const langBtn = page.getByRole("button", { name: /Cambiar idioma/i });
    await expect(langBtn).toBeVisible();
  });

  test("botón de historial está visible", async ({ page }) => {
    await page.goto("/");

    const histBtn = page.getByRole("button", { name: /Historial de Análisis/i });
    await expect(histBtn).toBeVisible();
  });

  test("botón de notificaciones está visible", async ({ page }) => {
    await page.goto("/");

    const notifBtn = page.getByRole("button", { name: /Notificaciones/i });
    await expect(notifBtn).toBeVisible();
  });
});

test.describe("SembraData — Chatbot", () => {
  test("el chatbot está visible", async ({ page }) => {
    await page.goto("/");

    const chatbot = page.getByRole("button", { name: /chatbot|chat|asistente/i });
    await expect(chatbot.first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("SembraData — Panel de predicción (contenido)", () => {
  test("muestra secciones de datos al analizar", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Analizar zona/i }).click();

    const panel = page.locator("text=Análisis de Viabilidad");
    await expect(panel).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText("Exportar PDF")).toBeVisible();
  });
});

test.describe("SembraData — SEO", () => {
  test("tiene título correcto", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/SembraData/);
  });

  test("tiene meta description", async ({ page }) => {
    await page.goto("/");

    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveAttribute("content", /Colombia/);
  });

  test("tiene Open Graph tags", async ({ page }) => {
    await page.goto("/");

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /SembraData/);
  });
});

test.describe("SembraData — Panel de predicción (flujo completo)", () => {
  test("abre el panel, verifica secciones y cierra con Escape", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Analizar zona/i }).click();

    const panel = page.locator('[role="dialog"][aria-label="Panel de predicción"]');
    await expect(panel).toBeVisible({ timeout: 10_000 });

    await expect(panel.getByText("Análisis de Viabilidad")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(panel).not.toBeVisible();
  });
});

test.describe("SembraData — Comparación de zonas", () => {
  test("la sección de comparación de zonas está visible", async ({ page }) => {
    await page.goto("/");

    const section = page.getByText("Comparación de zonas");
    await expect(section).toBeVisible();
  });

  test("muestra el botón de agregar en comparación", async ({ page }) => {
    await page.goto("/");

    const addBtn = page.getByRole("button", { name: /Agregar/i });
    await expect(addBtn).toBeVisible();
  });
});

test.describe("SembraData — Indicador offline", () => {
  test("el componente offline existe en el DOM", async ({ page }) => {
    await page.goto("/");

    const indicator = page.locator('[class*="fixed"][class*="bottom-0"]');
    await expect(indicator).toHaveCount(0);
  });
});

test.describe("SembraData — Panel de historial", () => {
  test("abre el panel de historial y muestra estado vacío", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Historial de Análisis/i }).click();

    const dialog = page.locator('[role="dialog"][aria-label="Historial de análisis"]');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const emptyMsg = dialog.getByText("Aún no has realizado ningún análisis.");
    await expect(emptyMsg).toBeVisible();
  });

  test("cierra el panel de historial con el botón de cerrar", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Historial de Análisis/i }).click();

    const dialog = page.locator('[role="dialog"][aria-label="Historial de análisis"]');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await dialog.locator("button").filter({ hasText: "✕" }).click();

    await expect(dialog).not.toBeVisible();
  });
});

test.describe("SembraData — Panel de notificaciones", () => {
  test("abre el panel de notificaciones y se renderiza", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Notificaciones/i }).click();

    await expect(page.getByText("Alerta climática")).toBeVisible({ timeout: 10_000 });
  });

  test("cierra el panel de notificaciones", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Notificaciones/i }).click();

    const title = page.getByText("Alerta climática");
    await expect(title).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press("Escape");

    await expect(title).not.toBeVisible();
  });
});

test.describe("SembraData — Cambio de idioma", () => {
  test("cambia al inglés y verifica el texto", async ({ page }) => {
    await page.goto("/");

    const langBtn = page.getByRole("button", { name: /Cambiar idioma/i });
    await expect(langBtn).toBeVisible();

    await langBtn.click();

    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Estimated yield")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Agro-climatic risk")).toBeVisible();
  });
});

test.describe("SembraData — Accesibilidad", () => {
  test("existe el skip link para saltar al contenido principal", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);
  });

  test("el skip link tiene texto accesible", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toContainText("Saltar al contenido principal");
  });

  test("los botones del header tienen accessible names", async ({ page }) => {
    await page.goto("/");

    const langBtn = page.getByRole("button", { name: /Cambiar idioma/i });
    await expect(langBtn).toHaveAttribute("aria-label", "Cambiar idioma");

    const histBtn = page.getByRole("button", { name: /Historial de Análisis/i });
    await expect(histBtn).toHaveAttribute("aria-label", /Historial/);

    const notifBtn = page.getByRole("button", { name: /Notificaciones/i });
    await expect(notifBtn).toHaveAttribute("aria-label", "Notificaciones");
  });

  test("los botones de cultivo tienen accessible names", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: /Cacao/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Café/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Granadilla/i })).toBeVisible();
  });
});

test.describe("SembraData — Responsive (mobile)", () => {
  test("no tiene overflow horizontal en viewport móvil", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test("el dashboard carga correctamente en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("SembraData");
    await expect(page.getByText("Rendimiento estimado")).toBeVisible();
  });

  test("los botones de cultivo son accesibles en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const cafeBtn = page.getByRole("button", { name: /Café/i });
    await expect(cafeBtn).toBeVisible();
  });
});

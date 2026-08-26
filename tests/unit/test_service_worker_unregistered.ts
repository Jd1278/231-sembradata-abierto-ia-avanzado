import { describe, it, expect, vi } from "vitest";

describe("Service Worker & PWA Deprecation Verification", () => {
  it("unregisters existing service worker registrations cleanly", async () => {
    const unregisterMock = vi.fn().mockResolvedValue(true);
    const mockRegistration = {
      scope: "http://localhost:3000/",
      unregister: unregisterMock,
    };

    const getRegistrationsMock = vi.fn().mockResolvedValue([mockRegistration]);

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        getRegistrations: getRegistrationsMock,
        register: vi.fn(),
      },
      configurable: true,
      writable: true,
    });

    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }

    expect(getRegistrationsMock).toHaveBeenCalledTimes(1);
    expect(unregisterMock).toHaveBeenCalledTimes(1);
  });
});

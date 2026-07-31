import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type Options = Omit<RenderOptions, "wrapper">;

export function setup(ui: ReactElement, options?: Options) {
  return {
    user: userEvent.setup(),
    ...render(ui, options),
  };
}

export * from "@testing-library/react";

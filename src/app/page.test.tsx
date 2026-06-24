import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("renders the scaffold", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start free" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start free without signing in/ })).toBeInTheDocument();
    expect(screen.queryByText(/30-day demo/i)).not.toBeInTheDocument();
  });
});

import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import ApiErrorAlert from "./ApiErrorAlert";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("ApiErrorAlert", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders nothing when message is null", () => {
    const { container } = renderWithLocale(<ApiErrorAlert message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows api_error_retryShort for known load failures when NODE_ENV is not development", () => {
    vi.stubEnv("NODE_ENV", "production");
    renderWithLocale(<ApiErrorAlert message="请求失败" />);
    expect(screen.getByText("请求失败")).toBeTruthy();
    expect(
      screen.getByText("请稍后重试；若持续失败，请检查网络或联系支持。"),
    ).toBeTruthy();
    expect(screen.queryByText(/请确认后端已启动/)).toBeNull();
  });

  it("shows api_error_backendHint when NODE_ENV is development", () => {
    vi.stubEnv("NODE_ENV", "development");
    renderWithLocale(<ApiErrorAlert message="请求失败" />);
    expect(screen.getByText(/请确认后端已启动/)).toBeTruthy();
  });

  it("does not append network/dev hint for compliance-class messages", () => {
    vi.stubEnv("NODE_ENV", "development");
    renderWithLocale(<ApiErrorAlert message="拒绝 403" />);
    expect(screen.getByText("拒绝 403")).toBeTruthy();
    expect(screen.queryByText(/请确认后端已启动/)).toBeNull();
  });
});

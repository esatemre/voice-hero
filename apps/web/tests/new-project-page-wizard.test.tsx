import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewProjectClient from "@/app/dashboard/new/new-project-client";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/components/setup-wizard", () => ({
  __esModule: true,
  default: ({
    onComplete,
  }: {
    onComplete?: (projectId: string) => void;
  }) => (
    <button type="button" onClick={() => onComplete?.("project-123")}>
      Complete Wizard
    </button>
  ),
}));

describe("NewProjectClient", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
  });

  it("marks onboarding and navigates on wizard completion", () => {
    render(<NewProjectClient />);

    fireEvent.click(screen.getByText("Complete Wizard"));

    expect(localStorage.getItem("first-time-user")).toBe("true");
    const checklist = JSON.parse(
      localStorage.getItem("onboarding-checklist") || "[]",
    );
    const projectCreated = checklist.find(
      (item: { id: string }) => item.id === "project-created",
    );
    expect(projectCreated?.completed).toBe(true);
    expect(projectCreated?.projectId).toBe("project-123");
    expect(mockPush).toHaveBeenCalledWith("/dashboard/project-123");
  });
});

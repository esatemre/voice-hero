import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SetupWizard from "@/components/setup-wizard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("SetupWizard", () => {
  const mockOnComplete = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders nothing when closed", () => {
      const { container } = render(
        <SetupWizard open={false} onOpenChange={mockOnOpenChange} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders the wizard when open", () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText("Setup Wizard")).toBeInTheDocument();
      expect(screen.getByText(/Project Basics/)).toBeInTheDocument();
      expect(
        screen.getByText("Tell us about your project"),
      ).toBeInTheDocument();
    });

    it("shows all step indicators", () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText("1. Project Basics")).toBeInTheDocument();
      expect(screen.getByText("2. Audience Segmentation")).toBeInTheDocument();
      expect(screen.getByText("3. Initial Scripts")).toBeInTheDocument();
      expect(screen.getByText("4. Voice Selection")).toBeInTheDocument();
      expect(screen.getByText("5. Review & Confirm")).toBeInTheDocument();
    });
  });

  describe("Step 1: Project Basics", () => {
    it("renders all form fields", () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByLabelText(/Website URL/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Product Description/i)).toBeInTheDocument();
      expect(screen.getByText(/Brand Tone/i)).toBeInTheDocument();
      expect(screen.getByText(/Language/i)).toBeInTheDocument();
      expect(screen.getByText("Auto-fill")).toBeInTheDocument();
    });

    it("shows validation error when project name is empty", () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      const nextButton = screen.getByText("Next").closest("button");
      fireEvent.click(nextButton!);

      expect(screen.getByText("Project name is required")).toBeInTheDocument();
    });

    it("shows validation error when website URL is empty", async () => {
      render(
        <SetupWizard
          open={true}
          onOpenChange={mockOnOpenChange}
          onComplete={mockOnComplete}
        />,
      );

      const nameInput = screen.getByLabelText(/Project Name/i);
      fireEvent.change(nameInput, { target: { value: "Test Project" } });

      const nextButton = screen.getByText("Next").closest("button");
      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(screen.getByText("Website URL is required")).toBeInTheDocument();
      });
    });

    it("shows validation error when description is empty", async () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      const nameInput = screen.getByLabelText(/Project Name/i);
      const urlInput = screen.getByLabelText(/Website URL/i);

      fireEvent.change(nameInput, { target: { value: "Test Project" } });
      fireEvent.change(urlInput, { target: { value: "https://example.com" } });

      const nextButton = screen.getByText("Next").closest("button");
      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(screen.getByText("Description is required")).toBeInTheDocument();
      });
    });

    it("allows navigation to next step with valid data", async () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      fireEvent.change(screen.getByLabelText(/Project Name/i), {
        target: { value: "Test Project" },
      });
      fireEvent.change(screen.getByLabelText(/Website URL/i), {
        target: { value: "https://example.com" },
      });
      fireEvent.change(screen.getByLabelText(/Product Description/i), {
        target: { value: "A test product" },
      });

      const nextButton = screen.getByText("Next").closest("button");
      fireEvent.click(nextButton!);
      await screen.findByText(/Audience Segmentation/i);
    });

    it("saves state to localStorage", async () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      fireEvent.change(screen.getByLabelText(/Project Name/i), {
        target: { value: "Test Project" },
      });
      fireEvent.change(screen.getByLabelText(/Website URL/i), {
        target: { value: "https://example.com" },
      });

      await waitFor(() => {
        expect(localStorage.getItem("wizard-state")).not.toBeNull();
      });

      const savedState = localStorage.getItem("wizard-state");
      const parsed = JSON.parse(savedState!);
      expect(parsed.projectName).toBe("Test Project");
      expect(parsed.websiteUrl).toBe("https://example.com");
    });
  });

  describe("Step 2: Audience Segmentation", () => {
    beforeEach(() => {
      localStorage.setItem(
        "wizard-state",
        JSON.stringify({
          step: 2,
          projectName: "Test Project",
          websiteUrl: "https://example.com",
          description: "Test description",
          tone: "professional",
          language: "en-US",
          targetNewVisitors: true,
          targetReturningVisitors: true,
          targetUtmCampaigns: true,
          targetLanguages: false,
          initialScripts: {
            welcome: "",
            returning: "",
            cta: "",
          },
          selectedVoiceId: null,
          widgetInstalled: false,
        }),
      );
    });

    it("renders all audience options", async () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      expect(await screen.findByText("New Visitors")).toBeInTheDocument();
      expect(screen.getByText("Returning Visitors")).toBeInTheDocument();
      expect(screen.getByText("UTM Campaigns")).toBeInTheDocument();
      expect(screen.getByText("Language-based")).toBeInTheDocument();
    });

    it("has Skip button", async () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      expect(await screen.findByText("Skip")).toBeInTheDocument();
    });
  });

  describe("Step 3: Initial Scripts", () => {
    beforeEach(() => {
      localStorage.setItem(
        "wizard-state",
        JSON.stringify({
          step: 3,
          projectName: "Test Project",
          websiteUrl: "https://example.com",
          description: "Test description",
          tone: "professional",
          language: "en-US",
          targetNewVisitors: true,
          targetReturningVisitors: true,
          targetUtmCampaigns: false,
          targetLanguages: false,
          initialScripts: {
            welcome: "Welcome to our site!",
            returning: "Welcome back!",
            cta: "Get started now!",
          },
          selectedVoiceId: null,
          widgetInstalled: false,
        }),
      );
    });

    it("renders all script textareas", async () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      expect(
        await screen.findByLabelText(/Welcome Script/i),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Returning Visitor Script/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/CTA Script/i)).toBeInTheDocument();
    });

    it('has "Use Defaults" button', async () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      expect(await screen.findByText("Use Defaults")).toBeInTheDocument();
    });
  });

  describe("Step 4: Voice Selection", () => {
    beforeEach(() => {
      localStorage.setItem(
        "wizard-state",
        JSON.stringify({
          step: 4,
          projectName: "Test Project",
          websiteUrl: "https://example.com",
          description: "Test description",
          tone: "professional",
          language: "en-US",
          targetNewVisitors: true,
          targetReturningVisitors: true,
          targetUtmCampaigns: false,
          targetLanguages: false,
          initialScripts: {
            welcome: "Welcome to our site!",
            returning: "Welcome back!",
            cta: "Get started now!",
          },
          selectedVoiceId: null,
          widgetInstalled: false,
        }),
      );

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              voices: [
                {
                  id: "voice1",
                  name: "Voice 1",
                  previewUrl: "https://example.com/preview.mp3",
                },
                {
                  id: "voice2",
                  name: "Voice 2",
                  previewUrl: "https://example.com/preview2.mp3",
                },
              ],
            }),
        }),
      ) as unknown as typeof global.fetch;
    });

    it('has "Choose Later" button when no voice selected', async () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText("Choose Later")).toBeInTheDocument();
      });
    });
  });

  describe("Step 5: Review & Confirm", () => {
    beforeEach(() => {
      localStorage.setItem(
        "wizard-state",
        JSON.stringify({
          step: 5,
          projectName: "Test Project",
          websiteUrl: "https://example.com",
          description: "Test description",
          tone: "professional",
          language: "en-US",
          targetNewVisitors: true,
          targetReturningVisitors: true,
          targetUtmCampaigns: false,
          targetLanguages: false,
          initialScripts: {
            welcome: "Welcome to our site!",
            returning: "Welcome back!",
            cta: "Get started now!",
          },
          selectedVoiceId: null,
          widgetInstalled: false,
        }),
      );

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "project123",
              name: "Test Project",
            }),
        }),
      ) as any;
    });

    it("shows project summary", async () => {
      render(
        <SetupWizard
          open={true}
          onOpenChange={mockOnOpenChange}
          onComplete={mockOnComplete}
        />,
      );

      await screen.findByText("Review Your Settings");
      expect(screen.getByText("Review Your Settings")).toBeInTheDocument();
      expect(screen.getByText("Test Project")).toBeInTheDocument();
      expect(screen.getByText("https://example.com")).toBeInTheDocument();
    });

    it('shows "Go Live" button', async () => {
      render(
        <SetupWizard
          open={true}
          onOpenChange={mockOnOpenChange}
          onComplete={mockOnComplete}
        />,
      );

      expect(await screen.findByText("Go Live")).toBeInTheDocument();
    });

    it("calls onComplete when Go to Dashboard is clicked on success screen", async () => {
      localStorage.setItem(
        "wizard-state",
        JSON.stringify({
          step: 5,
          projectName: "Test Project",
          websiteUrl: "https://example.com",
          description: "Test description",
          tone: "professional",
          language: "en-US",
          targetNewVisitors: true,
          targetReturningVisitors: true,
          targetUtmCampaigns: false,
          targetLanguages: false,
          initialScripts: {
            welcome: "Welcome!",
            returning: "Welcome back!",
            cta: "Get started!",
          },
          selectedVoiceId: null,
          widgetInstalled: false,
        }),
      );

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "project123",
              name: "Test Project",
            }),
        }),
      ) as any;

      render(
        <SetupWizard
          open={true}
          onOpenChange={mockOnOpenChange}
          onComplete={mockOnComplete}
        />,
      );

      const goLiveButton = (await screen.findByText("Go Live")).closest(
        "button",
      );
      fireEvent.click(goLiveButton!);

      const dashboardButton = await screen.findByText("Go to Dashboard");
      fireEvent.click(dashboardButton.closest("button")!);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith("project123");
      });
    });

    it("shows error when project creation fails", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Server error" }),
        }),
      ) as any;

      render(
        <SetupWizard
          open={true}
          onOpenChange={mockOnOpenChange}
          onComplete={mockOnComplete}
        />,
      );

      const goLiveButton = (await screen.findByText("Go Live")).closest(
        "button",
      );
      fireEvent.click(goLiveButton!);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to create project. Please try again."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Success Screen", () => {
    it("shows success screen after project creation", async () => {
      localStorage.setItem(
        "wizard-state",
        JSON.stringify({
          step: 5,
          projectName: "Test Project",
          websiteUrl: "https://example.com",
          description: "Test description",
          tone: "professional",
          language: "en-US",
          targetNewVisitors: true,
          targetReturningVisitors: true,
          targetUtmCampaigns: false,
          targetLanguages: false,
          initialScripts: {
            welcome: "Welcome to our site!",
            returning: "Welcome back!",
            cta: "Get started now!",
          },
          selectedVoiceId: null,
          widgetInstalled: false,
        }),
      );

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "project123",
              name: "Test Project",
            }),
        }),
      ) as any;

      render(
        <SetupWizard
          open={true}
          onOpenChange={mockOnOpenChange}
          onComplete={mockOnComplete}
        />,
      );

      const goLiveButton = (await screen.findByText("Go Live")).closest(
        "button",
      );
      fireEvent.click(goLiveButton!);

      await waitFor(() => {
        expect(
          screen.getByText("Project Launched Successfully!"),
        ).toBeInTheDocument();
      });
    });

    it("displays widget code in success screen", async () => {
      localStorage.setItem(
        "wizard-state",
        JSON.stringify({
          step: 5,
          projectName: "Test Project",
          websiteUrl: "https://example.com",
          description: "Test description",
          tone: "professional",
          language: "en-US",
          targetNewVisitors: true,
          targetReturningVisitors: true,
          targetUtmCampaigns: false,
          targetLanguages: false,
          initialScripts: {
            welcome: "Welcome!",
            returning: "Welcome back!",
            cta: "Get started!",
          },
          selectedVoiceId: null,
          widgetInstalled: false,
        }),
      );

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "project-xyz-123",
              name: "Test Project",
            }),
        }),
      ) as any;

      render(
        <SetupWizard
          open={true}
          onOpenChange={mockOnOpenChange}
          onComplete={mockOnComplete}
        />,
      );

      const goLiveButton = (await screen.findByText("Go Live")).closest(
        "button",
      );
      fireEvent.click(goLiveButton!);

      await waitFor(() => {
        expect(
          screen.getByText(/data-project-id="project-xyz-123"/),
        ).toBeInTheDocument();
      });
    });

    it('has "Go to Dashboard" button in success screen', async () => {
      localStorage.setItem(
        "wizard-state",
        JSON.stringify({
          step: 5,
          projectName: "Test Project",
          websiteUrl: "https://example.com",
          description: "Test description",
          tone: "professional",
          language: "en-US",
          targetNewVisitors: true,
          targetReturningVisitors: true,
          targetUtmCampaigns: false,
          targetLanguages: false,
          initialScripts: {
            welcome: "Welcome!",
            returning: "Welcome back!",
            cta: "Get started!",
          },
          selectedVoiceId: null,
          widgetInstalled: false,
        }),
      );

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "project123",
              name: "Test Project",
            }),
        }),
      ) as any;

      render(
        <SetupWizard
          open={true}
          onOpenChange={mockOnOpenChange}
          onComplete={mockOnComplete}
        />,
      );

      const goLiveButton = (await screen.findByText("Go Live")).closest(
        "button",
      );
      fireEvent.click(goLiveButton!);

      await waitFor(() => {
        expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("navigates through steps using Next and Back buttons", async () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      fireEvent.change(screen.getByLabelText(/Project Name/i), {
        target: { value: "Test Project" },
      });
      fireEvent.change(screen.getByLabelText(/Website URL/i), {
        target: { value: "https://example.com" },
      });
      fireEvent.change(screen.getByLabelText(/Product Description/i), {
        target: { value: "Test description" },
      });

      fireEvent.click(screen.getByText("Next").closest("button")!);

      await screen.findByText(/Audience Segmentation/i);

      fireEvent.click(screen.getByText("Back").closest("button")!);

      expect(await screen.findByText(/Project Basics/i)).toBeInTheDocument();
    });

    it("closes wizard when Exit button is clicked", () => {
      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      const exitButton = screen.getByText("Exit Wizard").closest("button");
      fireEvent.click(exitButton!);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("State Persistence", () => {
    it("loads state from localStorage on open", async () => {
      const savedState = {
        step: 3,
        projectName: "Saved Project",
        websiteUrl: "https://saved.com",
        description: "Saved description",
        tone: "casual" as const,
        language: "es",
        targetNewVisitors: false,
        targetReturningVisitors: true,
        targetUtmCampaigns: false,
        targetLanguages: true,
        initialScripts: {
          welcome: "Saved welcome",
          returning: "Saved returning",
          cta: "Saved cta",
        },
        selectedVoiceId: "voice123",
        widgetInstalled: true,
      };

      localStorage.setItem("wizard-state", JSON.stringify(savedState));

      render(<SetupWizard open={true} onOpenChange={mockOnOpenChange} />);

      expect(await screen.findByLabelText(/Welcome Script/i)).toHaveValue(
        "Saved welcome",
      );
      expect(screen.getByLabelText(/Returning Visitor Script/i)).toHaveValue(
        "Saved returning",
      );
      expect(screen.getByLabelText(/CTA Script/i)).toHaveValue("Saved cta");
    });

    it("clears localStorage when wizard completes", async () => {
      localStorage.setItem(
        "wizard-state",
        JSON.stringify({ step: 6, projectName: "Test" }),
      );

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "project123" }),
        }),
      ) as any;

      render(
        <SetupWizard
          open={true}
          onOpenChange={mockOnOpenChange}
          onComplete={mockOnComplete}
        />,
      );

      const goLiveButton = screen.getByText("Go Live").closest("button");
      fireEvent.click(goLiveButton!);

      await waitFor(() => {
        expect(localStorage.getItem("wizard-state")).toBeNull();
      });
    });
  });
});

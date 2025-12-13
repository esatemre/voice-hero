"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { VoiceProfile, WizardState, WizardStep } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Wand2,
  Play,
  Pause,
  Sparkles,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clientEnv } from "@/lib/env";
import {
  WIZARD_STORAGE_KEYS,
  getIncompleteWizardState,
} from "@/lib/wizard-helpers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SetupWizardProps {
  onComplete?: (projectId: string) => void;
}

const WIZARD_STEPS = [
  {
    step: 1,
    title: "Project Basics",
    description: "Tell us about your project",
  },
  {
    step: 2,
    title: "Audience Segmentation",
    description: "Who do you want to target?",
  },
  {
    step: 3,
    title: "Initial Scripts",
    description: "Set up your first voice scripts",
  },
  {
    step: 4,
    title: "Voice Selection",
    description: "Choose your default voice",
  },
  { step: 5, title: "Review & Confirm", description: "Review and launch" },
] as const;

const TONE_OPTIONS: {
  value: "professional" | "casual" | "playful" | "energetic";
  label: string;
}[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "playful", label: "Playful" },
  { value: "energetic", label: "Energetic" },
];

const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (US)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

const DEFAULT_SCRIPTS = {
  welcome:
    "Welcome to our site! We're excited to show you around. Feel free to explore our features and let us know if you have any questions.",
  returning:
    "Welcome back! Great to see you again. Check out what's new since your last visit.",
  cta: "Ready to get started? Click here to begin your journey with us today!",
};

const getLabelTags = (labels?: Record<string, string>) => {
  if (!labels) return [];
  return Object.entries(labels)
    .filter(([key, value]) => key && value)
    .map(([key, value]) => `${key}: ${value}`);
};

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const router = useRouter();
  const hasLoadedState = useRef(false);
  const skipInitialPersist = useRef(true);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useState<HTMLAudioElement | null>(null)[0];
  const [showAIModal, setShowAIModal] = useState(false);
  const [generatingScripts, setGeneratingScripts] = useState(false);
  const [aiContext, setAIContext] = useState({
    industry: "",
    targetCustomer: "",
    valueProp: "",
  });

  const [state, setState] = useState<WizardState>({
    step: 1,
    projectName: "",
    websiteUrl: "",
    description: "",
    email: "",
    tone: "professional",
    language: "en-US",
    targetNewVisitors: true,
    targetReturningVisitors: true,
    targetUtmCampaigns: true,
    targetLanguages: false,
    initialScripts: {
      welcome: DEFAULT_SCRIPTS.welcome,
      returning: DEFAULT_SCRIPTS.returning,
      cta: DEFAULT_SCRIPTS.cta,
    },
    selectedVoiceId: null,
    widgetInstalled: false,
  });
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load wizard state from localStorage only once on component mount
  useEffect(() => {
    if (hasLoadedState.current) return;

    hasLoadedState.current = true;
    const savedState = getIncompleteWizardState();
    if (savedState) {
      setState(savedState);
      setCurrentStep(savedState.step);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedState.current) return;
    if (skipInitialPersist.current) {
      skipInitialPersist.current = false;
      return;
    }

    const nextState = { ...state, step: currentStep };
    localStorage.setItem(
      WIZARD_STORAGE_KEYS.WIZARD_STATE,
      JSON.stringify(nextState)
    );
  }, [state, currentStep]);

  useEffect(() => {
    if (currentStep !== 4) return;

    const fetchVoices = async () => {
      setLoadingVoices(true);
      try {
        const res = await fetch("/api/voices");
        const data = await res.json();
        if (res.ok) {
          setVoices(data.voices || []);
        }
      } catch (e) {
        console.error("Failed to fetch voices", e);
      } finally {
        setLoadingVoices(false);
      }
    };

    fetchVoices();
  }, [currentStep]);

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleAutoFill = async () => {
    if (!state.websiteUrl) return;

    setScraping(true);
    setError("");
    try {
      const res = await fetch("/api/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: state.websiteUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        updateState({
          projectName: data.title || state.projectName,
          description: data.description || state.description,
        });
      }
    } catch {
      setError("Failed to auto-fill. Please enter details manually.");
    } finally {
      setScraping(false);
    }
  };

  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 1:
        if (!state.projectName.trim()) {
          return false;
        }
        if (!state.websiteUrl.trim()) {
          return false;
        }
        if (!state.description.trim()) {
          return false;
        }
        return true;
      case 2:
        if (
          !state.targetNewVisitors &&
          !state.targetReturningVisitors &&
          !state.targetUtmCampaigns &&
          !state.targetLanguages
        ) {
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError("");
      setCurrentStep((prev) => Math.min(prev + 1, 6) as WizardStep);
    } else {
      // Set appropriate error message based on step
      switch (currentStep) {
        case 1:
          if (!state.projectName.trim()) {
            setError("Project name is required");
          } else if (!state.websiteUrl.trim()) {
            setError("Website URL is required");
          } else if (!state.description.trim()) {
            setError("Description is required");
          }
          break;
        case 2:
          setError("Please select at least one audience type");
          break;
      }
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1) as WizardStep);
  };

  const handleSkip = () => {
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, 6) as WizardStep);
  };

  const handleStepClick = (step: WizardStep) => {
    if (step < currentStep || validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  const handleVoicePreview = (voice: VoiceProfile) => {
    if (!voice.previewUrl) return;

    if (playingVoiceId === voice.id) {
      audioRef?.pause();
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef) {
      audioRef.pause();
    }

    const audio = new Audio(voice.previewUrl);
    setPlayingVoiceId(voice.id);
    audio.play().catch(() => {
      setPlayingVoiceId(null);
    });
    audio.onended = () => {
      setPlayingVoiceId(null);
    };
  };

  const handleCreateProject = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.projectName,
          baseUrl: state.websiteUrl,
          description: state.description,
          email: state.email,
          tone: state.tone,
          language: state.language,
          initialScripts: state.initialScripts,
          selectedVoiceId: state.selectedVoiceId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData?.error || "Failed to create project. Please try again.";
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const project = await res.json();
      setProjectId(project.id);
      setShowSuccess(true);
      localStorage.removeItem("wizard-state");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to create project. Please try again.";
      setError(errorMessage);
      console.error("Error creating project:", e);
    } finally {
      setLoading(false);
    }
  };

  const getWidgetCode = (siteId?: string | null) => {
    const appUrl = clientEnv.APP_URL || "http://localhost:3000";
    const resolvedSiteId = siteId || "YOUR_PROJECT_ID";
    return `<script src="${appUrl}/widget.js" data-site-id="${resolvedSiteId}" data-api-url="${appUrl}" defer></script>`;
  };

  const handleCopyWidgetCode = () => {
    navigator.clipboard.writeText(getWidgetCode(projectId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateScriptsFromWebsite = async () => {
    if (!state.projectName.trim() || !state.description.trim()) {
      setError(
        "Please ensure project name and description are filled in step 1"
      );
      return;
    }

    setGeneratingScripts(true);
    setError("");
    try {
      // Generate all three scripts in parallel using website information
      const [welcomeRes, returningRes, ctaRes] = await Promise.all([
        fetch("/api/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: state.projectName,
            productDescription: state.description,
            segmentType: "new visitor",
            tone: state.tone,
            language: state.language,
          }),
        }),
        fetch("/api/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: state.projectName,
            productDescription: state.description,
            segmentType: "returning visitor",
            tone: state.tone,
            language: state.language,
          }),
        }),
        fetch("/api/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: state.projectName,
            productDescription: state.description,
            segmentType: "call-to-action focused",
            tone: state.tone,
            language: state.language,
          }),
        }),
      ]);

      const [welcomeData, returningData, ctaData] = await Promise.all([
        welcomeRes.json(),
        returningRes.json(),
        ctaRes.json(),
      ]);

      if (!welcomeRes.ok || !returningRes.ok || !ctaRes.ok) {
        const errorMessages = [
          !welcomeRes.ok && welcomeData?.error,
          !returningRes.ok && returningData?.error,
          !ctaRes.ok && ctaData?.error,
        ].filter(Boolean);
        throw new Error(
          errorMessages.length > 0
            ? errorMessages.join(", ")
            : "Failed to generate scripts"
        );
      }

      updateState({
        initialScripts: {
          welcome: welcomeData.script,
          returning: returningData.script,
          cta: ctaData.script,
        },
      });

      setShowAIModal(false);
      setAIContext({ industry: "", targetCustomer: "", valueProp: "" });
    } catch (e) {
      console.error("Failed to generate scripts", e);
      setError("Failed to generate scripts. Please try again.");
    } finally {
      setGeneratingScripts(false);
    }
  };

  const handleGenerateScriptsWithAI = async () => {
    if (
      !aiContext.industry.trim() ||
      !aiContext.targetCustomer.trim() ||
      !aiContext.valueProp.trim()
    ) {
      setError("Please fill in all fields");
      return;
    }

    setGeneratingScripts(true);
    setError("");
    try {
      const contextPrompt = `Industry: ${aiContext.industry}\nTarget Customer: ${aiContext.targetCustomer}\nValue Proposition: ${aiContext.valueProp}`;

      // Generate all three scripts in parallel
      const [welcomeRes, returningRes, ctaRes] = await Promise.all([
        fetch("/api/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: state.projectName,
            productDescription: `${state.description}\n\n${contextPrompt}`,
            segmentType: "new visitor",
            tone: state.tone,
            language: state.language,
          }),
        }),
        fetch("/api/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: state.projectName,
            productDescription: `${state.description}\n\n${contextPrompt}`,
            segmentType: "returning visitor",
            tone: state.tone,
            language: state.language,
          }),
        }),
        fetch("/api/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: state.projectName,
            productDescription: `${state.description}\n\n${contextPrompt}`,
            segmentType: "call-to-action focused",
            tone: state.tone,
            language: state.language,
          }),
        }),
      ]);

      const [welcomeData, returningData, ctaData] = await Promise.all([
        welcomeRes.json(),
        returningRes.json(),
        ctaRes.json(),
      ]);

      if (!welcomeRes.ok || !returningRes.ok || !ctaRes.ok) {
        const errorMessages = [
          !welcomeRes.ok && welcomeData?.error,
          !returningRes.ok && returningData?.error,
          !ctaRes.ok && ctaData?.error,
        ].filter(Boolean);
        throw new Error(
          errorMessages.length > 0
            ? errorMessages.join(", ")
            : "Failed to generate scripts"
        );
      }

      updateState({
        initialScripts: {
          welcome: welcomeData.script,
          returning: returningData.script,
          cta: ctaData.script,
        },
      });

      setShowAIModal(false);
      setAIContext({ industry: "", targetCustomer: "", valueProp: "" });
    } catch (e) {
      console.error("Failed to generate scripts", e);
      setError("Failed to generate scripts. Please try again.");
    } finally {
      setGeneratingScripts(false);
    }
  };

  // Show success screen after project creation
  if (showSuccess && projectId) {
    const widgetCode = getWidgetCode(projectId);

    return (
      <div className="-m-4 md:-m-8 min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col"
        >
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Project Launched Successfully!
              </h2>
              <p className="text-gray-600">
                Your Voice Hero project is now live and ready to engage your
                visitors.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                Next: Integrate the Widget
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Copy your widget code and paste it into your website&apos;s{" "}
                <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">
                  &lt;head&gt;
                </code>{" "}
                section to start engaging visitors.
              </p>
              <div className="bg-white rounded p-3 font-mono text-xs text-gray-700 break-words">
                {widgetCode}
              </div>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWidgetCode}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Script
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  if (onComplete) {
                    onComplete(projectId);
                  } else {
                    router.push(`/dashboard/${projectId}`);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const stepConfig = WIZARD_STEPS.find((s) => s.step === currentStep);

  return (
    <div className="-m-4 md:-m-8 min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center p-6 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg w-full max-w-3xl overflow-hidden flex flex-col"
      >
        <div className="border-b border-gray-100 p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Setup Wizard
              </h2>
              <p className="text-sm text-gray-500">{stepConfig?.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {WIZARD_STEPS.map((s) => {
              const canClickStep =
                s.step <= currentStep || validateStep(currentStep);
              return (
                <button
                  key={s.step}
                  onClick={() => handleStepClick(s.step)}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-all duration-300",
                    s.step <= currentStep ? "bg-blue-600" : "bg-gray-200"
                  )}
                  disabled={!canClickStep}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {WIZARD_STEPS.map((s) => (
              <span
                key={s.step}
                className={cn(
                  "text-xs",
                  s.step === currentStep
                    ? "text-blue-600 font-medium"
                    : "text-gray-400"
                )}
              >
                {s.step}. {s.title}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-7">
                      <Label htmlFor="websiteUrl">Website URL *</Label>
                      <div className="relative mt-2">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="websiteUrl"
                          value={state.websiteUrl}
                          onChange={(e) =>
                            updateState({ websiteUrl: e.target.value })
                          }
                          placeholder="https://example.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-5">
                      <Label>&nbsp;</Label>
                      <Button
                        type="button"
                        onClick={handleAutoFill}
                        disabled={scraping || !state.websiteUrl}
                        className="w-full mt-2"
                        variant="outline"
                      >
                        {scraping ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Auto-filling...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Auto-fill
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="projectName">Project Name *</Label>
                    <Input
                      id="projectName"
                      value={state.projectName}
                      onChange={(e) =>
                        updateState({ projectName: e.target.value })
                      }
                      placeholder="My Awesome Product"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Product Description *</Label>
                    <Textarea
                      id="description"
                      value={state.description}
                      onChange={(e) =>
                        updateState({ description: e.target.value })
                      }
                      placeholder="Describe your product or paste your homepage copy..."
                      className="min-h-[100px] mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={state.email}
                      onChange={(e) => updateState({ email: e.target.value })}
                      placeholder="you@company.com"
                      className="mt-2"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      We send setup tips and go-live confirmations to this
                      address.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tone">Brand Tone</Label>
                      <Select
                        value={state.tone}
                        onValueChange={(
                          value:
                            | "professional"
                            | "casual"
                            | "playful"
                            | "energetic"
                        ) => updateState({ tone: value })}
                      >
                        <SelectTrigger id="tone" className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={state.language}
                        onValueChange={(value) =>
                          updateState({ language: value })
                        }
                      >
                        <SelectTrigger id="language" className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <p className="text-sm text-gray-600">
                      Select the audience segments you want to target. You can
                      customize these later.
                    </p>

                    <div className="space-y-3">
                      {[
                        {
                          key: "targetNewVisitors",
                          label: "New Visitors",
                          desc: "First-time visitors to your site",
                        },
                        {
                          key: "targetReturningVisitors",
                          label: "Returning Visitors",
                          desc: "Users who have visited before",
                        },
                        {
                          key: "targetUtmCampaigns",
                          label: "UTM Campaigns",
                          desc: "Visitors from specific marketing campaigns",
                        },
                        {
                          key: "targetLanguages",
                          label: "Language-based",
                          desc: "Visitors speaking different languages",
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <Label className="font-medium">{item.label}</Label>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                          <Switch
                            checked={
                              (state as unknown as { [key: string]: boolean })[
                                item.key
                              ]
                            }
                            onCheckedChange={(checked) =>
                              updateState({
                                [item.key]: checked,
                              } as Partial<WizardState>)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Set up your initial scripts. You can edit these later or
                        let AI generate them.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowAIModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      AI Generate
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="welcomeScript">Welcome Script</Label>
                      <Textarea
                        id="welcomeScript"
                        value={state.initialScripts.welcome}
                        onChange={(e) =>
                          updateState({
                            initialScripts: {
                              ...state.initialScripts,
                              welcome: e.target.value,
                            },
                          })
                        }
                        className="min-h-[80px] mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="returningScript">
                        Returning Visitor Script
                      </Label>
                      <Textarea
                        id="returningScript"
                        value={state.initialScripts.returning}
                        onChange={(e) =>
                          updateState({
                            initialScripts: {
                              ...state.initialScripts,
                              returning: e.target.value,
                            },
                          })
                        }
                        className="min-h-[80px] mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ctaScript">CTA Script</Label>
                      <Textarea
                        id="ctaScript"
                        value={state.initialScripts.cta}
                        onChange={(e) =>
                          updateState({
                            initialScripts: {
                              ...state.initialScripts,
                              cta: e.target.value,
                            },
                          })
                        }
                        className="min-h-[80px] mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Choose a default voice for your project. You can change this
                    anytime.
                  </p>

                  {loadingVoices ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading voices...
                    </div>
                  ) : voices.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No voices available. You can select a voice later.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 max-h-[400px] overflow-y-auto">
                      {voices.map((voice) => {
                        const isSelected = state.selectedVoiceId === voice.id;
                        const tags = getLabelTags(voice.labels).slice(0, 3);
                        const isPlaying = playingVoiceId === voice.id;

                        return (
                          <div
                            key={voice.id}
                            onClick={() =>
                              updateState({ selectedVoiceId: voice.id })
                            }
                            className={cn(
                              "text-left p-4 rounded-lg border-2 transition-all cursor-pointer",
                              isSelected
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium">{voice.name}</h3>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            {voice.description && (
                              <p className="text-sm text-gray-500 mb-2">
                                {voice.description}
                              </p>
                            )}
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {voice.previewUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVoicePreview(voice);
                                }}
                                className="text-xs"
                              >
                                {isPlaying ? (
                                  <>
                                    <Pause className="mr-1 h-3 w-3" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-1 h-3 w-3" />
                                    Preview
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 p-6 space-y-6">
                    <h3 className="font-medium text-lg">
                      Review Your Settings
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm text-gray-500">
                          Project Name
                        </Label>
                        <p className="font-medium">{state.projectName}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">
                          Website URL
                        </Label>
                        <p className="font-medium">{state.websiteUrl}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Tone</Label>
                        <p className="font-medium capitalize">{state.tone}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">
                          Language
                        </Label>
                        <p className="font-medium">
                          {
                            LANGUAGE_OPTIONS.find(
                              (l) => l.value === state.language
                            )?.label
                          }
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-gray-500">
                        Target Segments
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {state.targetNewVisitors && <Badge>New Visitors</Badge>}
                        {state.targetReturningVisitors && (
                          <Badge>Returning Visitors</Badge>
                        )}
                        {state.targetUtmCampaigns && (
                          <Badge>UTM Campaigns</Badge>
                        )}
                        {state.targetLanguages && <Badge>Language-based</Badge>}
                      </div>
                    </div>

                    {state.selectedVoiceId && (
                      <div>
                        <Label className="text-sm text-gray-500">
                          Selected Voice
                        </Label>
                        <p className="font-medium">
                          {voices.find((v) => v.id === state.selectedVoiceId)
                            ?.name || "Unknown"}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <p>
                          Your data is secure and private. You can modify all
                          settings later.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="border-t border-gray-100 p-6 flex items-center justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep === 2 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}
            {currentStep === 3 && (
              <Button
                variant="ghost"
                onClick={() => updateState({ initialScripts: DEFAULT_SCRIPTS })}
              >
                Use Defaults
              </Button>
            )}
            {currentStep === 4 && !state.selectedVoiceId && (
              <Button variant="ghost" onClick={handleSkip}>
                Choose Later
              </Button>
            )}
            {currentStep < 5 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCreateProject} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Go Live
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* AI Generation Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
          <div className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Generate Scripts with AI
              </DialogTitle>
              <DialogDescription>
                Tell us a bit about your business so we can generate relevant
                scripts for your audience. Or skip to generate from your website
                information.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 space-y-4 flex-1 overflow-y-auto min-h-0">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-sm font-medium">
                Industry / Business Type *
              </Label>
              <Input
                id="industry"
                value={aiContext.industry}
                onChange={(e) =>
                  setAIContext({ ...aiContext, industry: e.target.value })
                }
                placeholder="e.g., SaaS, E-commerce, Healthcare"
                disabled={generatingScripts}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetCustomer" className="text-sm font-medium">
                Your Ideal Customer *
              </Label>
              <Input
                id="targetCustomer"
                value={aiContext.targetCustomer}
                onChange={(e) =>
                  setAIContext({ ...aiContext, targetCustomer: e.target.value })
                }
                placeholder="e.g., Busy managers, Small business owners"
                disabled={generatingScripts}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valueProp" className="text-sm font-medium">
                Main Value Proposition *
              </Label>
              <Textarea
                id="valueProp"
                value={aiContext.valueProp}
                onChange={(e) =>
                  setAIContext({ ...aiContext, valueProp: e.target.value })
                }
                placeholder="What's the main benefit you provide?"
                className="min-h-[100px] w-full resize-y"
                disabled={generatingScripts}
              />
            </div>
          </div>

          <div className="px-6 pb-6 pt-4 flex-shrink-0 border-t">
            <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleGenerateScriptsFromWebsite}
              disabled={
                generatingScripts ||
                !state.projectName.trim() ||
                !state.description.trim()
              }
              className="w-full sm:w-auto order-3 sm:order-1"
            >
              {generatingScripts ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Generate from Website
                </>
              )}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button
                variant="outline"
                onClick={() => setShowAIModal(false)}
                disabled={generatingScripts}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateScriptsWithAI}
                disabled={
                  generatingScripts ||
                  !aiContext.industry.trim() ||
                  !aiContext.targetCustomer.trim() ||
                  !aiContext.valueProp.trim()
                }
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex-1 sm:flex-initial"
              >
                {generatingScripts ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Scripts
                  </>
                )}
              </Button>
            </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

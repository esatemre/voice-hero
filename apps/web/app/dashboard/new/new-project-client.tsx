"use client";

import { useRouter } from "next/navigation";
import SetupWizard from "@/components/setup-wizard";
import {
  completeOnboardingItem,
  markUserAsOnboarded,
} from "@/lib/wizard-helpers";

export default function NewProjectClient() {
  const router = useRouter();

  const handleWizardComplete = (projectId: string) => {
    markUserAsOnboarded();
    completeOnboardingItem("project-created", projectId);
    router.push(`/dashboard/${projectId}`);
  };

  return <SetupWizard onComplete={handleWizardComplete} />;
}

import { redirect } from "next/navigation";
import { getServerFeatureFlag } from "@/lib/server-feature-flags";
import NewProjectClient from "./new-project-client";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const creationEnabled = await getServerFeatureFlag(
    "new_project_creation_enabled",
  );

  if (!creationEnabled) {
    redirect("/dashboard");
  }

  return <NewProjectClient />;
}

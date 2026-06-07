import { z } from "zod";
import { AppError } from "@/shared/errors.ts";

/**
 * Phase 3 - Autonomous execution (scaffold).
 *
 * Target flow: user says "Build authentication module" -> Engineer agent makes
 * an implementation plan -> generates code -> generates tests -> opens a PR.
 * Phase 2 GitHub integration is complete; execution is gated until a sandboxed
 * code runner is added.
 */
export const BuildModuleSchema = z.object({
  projectId: z.string().uuid(),
  instruction: z.string().min(3),
  repo: z.string().optional(),
});
export type BuildModuleInput = z.infer<typeof BuildModuleSchema>;

export interface AutonomousBuildResult {
  plan: string[];
  files: { path: string; description: string }[];
  tests: string[];
  pullRequestUrl: string | null;
}

export class AutonomyService {
  async build(_input: BuildModuleInput): Promise<AutonomousBuildResult> {
    throw AppError.notImplemented(
      "Autonomous execution (Phase 3) is scaffolded. Requires a sandboxed code runner.",
    );
  }
}

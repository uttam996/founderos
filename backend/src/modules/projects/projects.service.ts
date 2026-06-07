import type { ProjectsRepository } from "@/modules/projects/projects.repository.ts";
import type { CreateProjectInput, Project } from "@/modules/projects/projects.schema.ts";
import { AppError } from "@/shared/errors.ts";
import { ideaLabel } from "@/ai/tools/index.ts";

export class ProjectsService {
  constructor(private readonly repo: ProjectsRepository) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const name = (input.name ?? ideaLabel(input.idea)).slice(0, 120);
    return this.repo.create(name, input.idea);
  }

  list(): Promise<Project[]> {
    return this.repo.list();
  }

  async get(id: string): Promise<Project> {
    const project = await this.repo.findById(id);
    if (!project) throw AppError.notFound("Project not found");
    return project;
  }

  setStatus(id: string, status: Project["status"]): Promise<void> {
    return this.repo.setStatus(id, status);
  }

  setGithubRepo(id: string, repo: string): Promise<void> {
    return this.repo.setGithubRepo(id, repo);
  }
}

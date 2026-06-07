-- Phase 2: GitHub integration — link projects/tasks to GitHub issues.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo TEXT;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_issue_number INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_issue_url TEXT;

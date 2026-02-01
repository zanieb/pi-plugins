---
name: debug-ci
description: Debug CI/CD failures using the GitHub CLI (gh). Use when CI checks fail, workflow runs error out, or you need to investigate GitHub Actions logs. Requires the gh CLI to be installed and authenticated.
---

# Debug CI Failures

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
- Current directory is a GitHub repository

## Workflow

### 1. Check recent workflow runs

```bash
gh run list --limit 10
```

### 2. Identify the failed run

Look for runs with status `failure` or `cancelled`. Note the run ID.

### 3. View the failed run details

```bash
gh run view <run-id>
```

This shows which jobs failed and their duration.

### 4. Get the failed job logs

```bash
gh run view <run-id> --log-failed
```

This outputs only the logs from failed steps, which is the most useful for debugging.

**If the run is still in progress** (e.g. some jobs passed, some failed, some pending),
`--log-failed` and `--log` will refuse with "run is still in progress". In that case,
fetch logs for individual completed jobs directly via the API:

```bash
# First, find the failed job IDs:
gh run view <run-id> --json jobs --jq '.jobs[] | select(.conclusion == "failure") | {name, id: .databaseId}'

# Then fetch logs for a specific job (works even while the run is in progress):
gh api repos/{owner}/{repo}/actions/jobs/<job-id>/logs 2>&1 | grep -E "\bFAIL\b" | head -30
```

### 5. If you need full logs for a specific job

```bash
gh run view <run-id> --log --job <job-id>
```

### 6. Check the workflow file

```bash
gh run view <run-id> --yaml
```

Or read the workflow file directly from `.github/workflows/`.

### 7. View specific check annotations

```bash
gh run view <run-id> --json jobs --jq '.jobs[] | select(.conclusion == "failure") | {name, conclusion, steps: [.steps[] | select(.conclusion == "failure")]}'
```

## Tips

- Use `gh run view <run-id> --log-failed 2>&1 | head -200` if logs are very long
- For PR-specific checks: `gh pr checks` shows check status for the current branch
- To re-run failed jobs: `gh run rerun <run-id> --failed`
- To watch a running workflow: `gh run watch <run-id>`

## Common Patterns

### Quick check current branch CI status
```bash
gh pr checks
```

### Find and debug the latest failure
```bash
gh run list --status failure --limit 1 --json databaseId --jq '.[0].databaseId' | xargs -I {} gh run view {} --log-failed
```

### Check if failure is flaky (compare with previous runs)
```bash
gh run list --workflow <workflow-name> --limit 5
```

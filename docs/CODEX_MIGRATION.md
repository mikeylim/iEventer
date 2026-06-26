# Claude to Codex Migration

This project was previously developed through Claude Code. Codex cannot directly import a Claude Code chat session as live conversation state, tool state, or internal memory. The practical migration is to move durable project knowledge into files Codex will read and maintain.

## What Was Migrated

The useful Claude memory from `/Users/mikedohyunlim/.claude/projects/-Users-mikedohyunlim-Projects-JS-iEventer/memory/` has been condensed into `AGENTS.md`:

- Project purpose: iEventer is a portfolio-grade AI event/activity discovery app.
- User profile: Mike is a junior full-stack developer using the project to support job hunting.
- Product priority: choose practical, hiring-manager-relevant engineering work over shallow feature additions.
- Deferred agenda:
  - Share Plan using the existing `shareSlug` schema support.
  - Browse Events / Categories / Saved nav links once real screens exist.
  - Cloudflare Hyperdrive wiring after the instance ID is available.
  - Cloudflare Cron trigger for daily picks.

The broader implementation history is already preserved in:

- `CHANGELOG.md` for completed phases.
- `ROADMAP.md` for next phases and deferred work.
- `README.md` for the public product story and architecture.
- `docs/DEPLOY.md` for Cloudflare deployment, OAuth, and production troubleshooting.

## Claude Artifacts Reviewed

Local Claude project path:

```text
/Users/mikedohyunlim/.claude/projects/-Users-mikedohyunlim-Projects-JS-iEventer
```

Reviewed artifacts:

- `memory/MEMORY.md`
- `memory/project_context.md`
- `memory/user_profile.md`
- `memory/deferred_features.md`
- Main session JSONL files
- Repo-level `.claude/settings.local.json`

The JSONL logs were not copied into the repo because they are noisy, contain transient tool state, and may contain sensitive local context. They can still be consulted manually if an old decision needs deeper archaeology.

## What Cannot Be Fully Migrated

These parts of a Claude Code session do not have a safe one-to-one Codex import:

- Full chat history as active model context.
- Claude's internal memory state.
- Tool permissions and local allow-lists.
- Running shell/tool state.
- Provider-specific settings.
- Secrets embedded in local command history.

Instead, future Codex sessions should rely on `AGENTS.md`, `README.md`, `CHANGELOG.md`, `ROADMAP.md`, and the source tree.

## Secret Handling

The repo-level Claude settings file contained command allow-list entries with an Eventbrite bearer token embedded in a shell command. That token was intentionally not migrated into Codex context.

Keep secrets only in the correct secret stores:

- `.env.local` for local development.
- Cloudflare Worker secrets for production runtime.
- GitHub repository secrets for CI/CD.
- Provider dashboards for credential rotation.

If that Eventbrite token is still active, rotating it is the safest cleanup step.

## How To Use Codex Going Forward

Start future work from the repo root:

```bash
cd /Users/mikedohyunlim/Projects/JS/ieventer
```

Codex should read `AGENTS.md` automatically for project-specific instructions. When asking Codex to continue work, point it to the relevant durable file:

- "Use `ROADMAP.md` and tell me the next best phase."
- "Use `CHANGELOG.md` and explain what Phase 8 added."
- "Use `docs/DEPLOY.md` and help debug Cloudflare deploy."
- "Use `AGENTS.md` project context and implement the next portfolio-impactful polish task."

When a new important project decision is made, add it to the right durable file:

- Completed work: `CHANGELOG.md`
- Future work or deferred ideas: `ROADMAP.md`
- Agent-specific working context: `AGENTS.md`
- Deployment instructions: `docs/DEPLOY.md`

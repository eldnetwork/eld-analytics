# Contributing

Thank you for your interest in contributing to Eld Analytics. This document explains how to contribute to the project.

## Good first contributions

These areas are a solid place to start:

- **Improve the disk widget** — clearer layout, denser or more readable presentation, better empty/error/loading states, additional useful fields from data already fetched.
- **Polish copy and consistency** — labels, README / docs alignment with the live UI.
- **Tests for pure helpers** — assertions around formatting or series builders under `src/lib/`.

If you are unsure whether an idea fits, open an issue first and describe the intended change.

## Discuss internals before large work

Changes that touch core internals — for example data-fetching in `src/api/`, the Vite proxy contract, env/config, or CI quality gates — should be discussed with maintainers before you invest significant time. Open an issue or draft PR with the problem and proposed approach so scope and design can be agreed early.

## Development setup

See the [README](README.md) for prerequisites (Node.js >= 20), environment variables, and how to run the app:

```bash
npm install
cp .env.example .env
npm start
```

The toolchain version is pinned in [`.nvmrc`](.nvmrc) (Node 20). Use that version locally when possible so CI and local results match.

This app expects a local analytics API (default `http://127.0.0.1:9010`). Vite proxies `/api/*` to that base URL.

## Before you open a pull request

### Keep your branch current with `main`

Always rebase or merge the latest `main` into your branch before opening or updating a PR:

```bash
git fetch origin
git merge origin/main
# or: git rebase origin/main
```

Resolve any conflicts locally, re-run the checks below, then push.

### Run the same checks as CI

GitHub Actions runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml), which executes `npm run ci`. Run the full CI gate before you push or request review:

```bash
npm run ci
```

`npm run ci` runs, in order:

- `npm run format:check` (Prettier)
- `npm run lint` (oxlint)
- `npm test` (Vitest)
- `npm audit --omit=dev --audit-level=high`
- `npm run build`

Fix formatting with `npm run format` if the format check fails. Do not submit with lint or test failures.

## Pull request guidelines

- Prefer small, focused PRs that are easy to review.
- Describe **what** changed and **why** in the PR body. Link related issues when applicable.
- Match existing code style and folder boundaries (`api/`, `components/`, `lib/`).
- Do not commit secrets — for example `.env` or other local env files.
- Ensure CI checks pass on the tip of your branch.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE) that covers this project.

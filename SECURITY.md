# Security Policy

## Supported versions

Security fixes are applied to the latest code on `main`.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report them privately using [GitHub Security Advisories](https://github.com/eldnetwork/eld-analytics/security/advisories/new):

1. Go to the repository’s **Security** tab.
2. Choose **Advisories** → **New draft security advisory** (or use the link above).
3. Include a clear description, steps to reproduce, affected versions if known, and any suggested fix.

We aim to acknowledge reports promptly, typically within a few days. After triage, we will work with you on a fix and coordinated disclosure when appropriate.

## Scope

This repository is a **local-only** Vite + React dashboard for Eld cluster disk analytics. It is meant to run on a developer or operator machine against a local analytics API. It is not a hosted public website.

In scope:

- Cross-site scripting or HTML injection in the dashboard UI
- Secrets or credentials committed to this repository
- Supply-chain issues in this repo’s npm dependencies that affect local builds
- Compromised or unexpected behavior in the repo’s CI workflow

Out of scope for this repository:

- The Eld protocol, node software, consensus, cryptography, or analytics API backends
- Correctness or availability of data returned by a local analytics API
- Misconfiguration of a local `.env` or proxy target
- Third-party outages (GitHub, npm)
- Social-engineering against Eld accounts

If you are unsure whether a finding belongs here, report it privately through the advisory form above and we will route it.

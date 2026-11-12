---
name: avalanche-cli-setup
description: Use when the agent needs to install the avalanche-cli and learn the core commands for creating, deploying, and controlling Avalanche L1s locally and on Fuji/mainnet.
category: Avalanche L1
difficulty: Beginner
version: "0.1.0"
---

# avalanche-cli — Setup & Core Commands

## Overview
`avalanche-cli` (repo `avalanche-cli`) is the command-line tool for creating and deploying Avalanche L1s. It scaffolds a chain config (VM, precompiles, gas token), deploys locally or to Fuji/mainnet, and manages the local network.

> **Note:** As of Dec 2025 the CLI is in maintenance mode (security/critical fixes only), but it remains the standard local L1 workflow. Tested on Linux/macOS; **Windows is not supported** — use WSL2 or the Dev Container / Codespace.

## Install
```sh
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s
export PATH=~/bin:$PATH          # add to ~/.bashrc to persist
avalanche --version
```
Custom location: append `-- -b <dir>` to the install command.

## Core commands
```sh
# Create an L1 config (interactive: pick Subnet-EVM, chain ID, gas token, precompiles)
avalanche blockchain create <L1Name>

# Deploy it
avalanche blockchain deploy <L1Name>          # choose Local / Fuji / Mainnet

# Inspect
avalanche blockchain describe <L1Name>
avalanche blockchain list

# Local network control
avalanche network stop      # shut down local deployment
avalanche network start     # resume from where you left off
avalanche network clean     # wipe local state
```

## Global node config
A config file at `$HOME/.avalanche-cli/config.json` (or `--config <path>`) can override local avalanchego node behavior via the `node-config` key.

## Dev Container / Codespace
The repo ships a Dev Container spec — run it via GitHub Codespaces (**Code → Codespaces → Create**) or locally with Docker + VS Code. Best path on Windows.

## Common Pitfalls
- **Running on native Windows.** Unsupported — use WSL2/Codespace.
- **PATH not set.** Add `export PATH=~/bin:$PATH` to your shell init.
- **"subnet" vs "blockchain" subcommands.** Newer CLI uses `blockchain`; older guides may show `subnet`.

## AI Agent Prompt
> "Act as an Avalanche tooling expert. Install `avalanche-cli`, then scaffold and deploy a local Subnet-EVM L1, explaining each `blockchain create` prompt (VM, chain ID, gas token, precompiles)."

## References
See `references/README.md` (avalanche-cli README, builders-hub `docs/tooling/avalanche-cli`).

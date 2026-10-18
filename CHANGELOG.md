# Changelog

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the package uses semantic versioning.

## [0.1.0] - 2026-10-18

### Added

- `holderTier` and `readBalance` for ERC-20 balances on Robinhood Chain at one block, with a chain-id check.
- `tierFor` and `resolveTable` for caller-supplied threshold tables.
- `robinhoodChain(rpcUrl)` viem chain definition for chain id 4663, with no built-in RPC URL.

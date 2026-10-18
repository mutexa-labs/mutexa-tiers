# Security

This package decides which tier an address is in from its token balance. A wrong tier can grant or deny access,
so a wrong result is a security problem, not only a bug.

## Reporting

Please report privately through GitHub's private vulnerability reporting on this repository
(Security tab, "Report a vulnerability"). Do not open a public issue for a problem that could map a balance to
the wrong tier or read from the wrong chain or contract.

Include the token, the block, the balance read and the tier you expected.

## Scope

- Wrong mapping from a balance to a tier.
- Reads that skip the chain-id check or are not pinned to one block.
- Anything in the published package that is not in this repository.

The package only makes read calls (`eth_chainId`, `eth_blockNumber`, `eth_call`) to the RPC you pass. It never
signs or sends a transaction.

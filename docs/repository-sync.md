# Organization repository sync

Source: `MCK-D/epiblockchain` (the personal repository).
Destination: `EpitechPGE45-2026/G-ING-910-PAR-9-1-blockchain-2`.

The workflow runs in the personal repository on pushes, deletions, manual dispatch,
and hourly as a recovery check. Its repository guard prevents the copied workflow
from running in the organization repository.

## One-time activation

1. Create a fine-grained personal access token with resource owner
   `EpitechPGE45-2026`, restricted to the destination repository, with
   **Contents: Read and write** and **Workflows: Read and write**. The workflow
   file itself is copied, so Workflows access is required. Complete any required
   organization approval. The token owner must have write access.
2. In the personal repository, open **Settings → Secrets and variables →
   Actions** and add a repository secret named `ORG_MIRROR_TOKEN`.
   Never commit the token or paste it into chat.
3. Open **Actions → Sync organization repository → Run workflow** on `main`.
   Confirm that the run succeeds and the destination branch commit IDs match
   the source. Future pushes sync automatically while the credential is valid.

The default `GITHUB_TOKEN` only reads the source; it cannot write to another
private repository. A missing token produces an explicit workflow error.

## Sync behavior

All source branches and tags are pushed with their complete Git history.
The push is atomic: a rejected ref prevents all refs in that push from updating.
Updates are fast-forward only. Destination-only branches and tags are preserved;
deletions and rewritten source history are not propagated. If the organization
repository has independent commits, a conflicting tag, or branch rules requiring
pull requests, the run fails instead of overwriting those changes. Review and
resolve that divergence before retrying. This is a one-way sync; make normal
development changes in the personal repository.

This sync covers Git branches and tags, not issues, PRs, releases, secrets,
repository settings, or Git LFS objects. GitHub may delay scheduled runs.

# Deploying petzko.sh

petzko.sh ships its own Helm chart (`charts/petzko-sh`) and ArgoCD `Application`
manifests (`deploy/argocd`), so it is self-contained and can be deployed to any
cluster — it does not depend on any particular cluster repo.

## Prerequisites on the target cluster

- ArgoCD installed (manifests assume it lives in the `argocd` namespace).
- ArgoCD has read access to this repo (`git@github.com:petzkod5/petzko.sh.git`)
  — e.g. an SSH deploy key or repo credential.
- A Traefik Gateway API `Gateway` named `traefik-gateway` in the `traefik`
  namespace, with `web` (HTTP) and `websecure` (HTTPS) listeners. Adjust
  `httpRoute.gateway.*` / `httpRoute.listenerName` in the chart values if yours
  differ.
- The image `ghcr.io/petzkod5/petzko-sh` is public, so no pull secret is needed.

## Bootstrap

Apply the Application for the environment you want:

```bash
# Staging — internal HTTP at petzko.home.local
kubectl apply -f deploy/argocd/petzko-sh-staging.yaml

# Production — public HTTPS at petzko.sh
kubectl apply -f deploy/argocd/petzko-sh-prod.yaml
```

ArgoCD then pulls the chart from this repo, renders the matching value overlay
(`charts/petzko-sh/values-{staging,prod}.yaml`), and syncs it.

## Environments

| Env     | Namespace        | Hostname            | Listener    | Image tag             |
| ------- | ---------------- | ------------------- | ----------- | --------------------- |
| staging | `petzko-staging` | `petzko.home.local` | `web`       | semver, auto-bumped   |
| prod    | `petzko-prod`    | `petzko.sh`         | `websecure` | semver, pinned manual |

## Versioning & promotion

Releases are cut by semantic-release from conventional commits on `main` (see
`.github/workflows/release.yml`), which publishes an immutable
`ghcr.io/petzkod5/petzko-sh:<version>` image.

- **Staging** auto-tracks the latest release: each release commits the new
  version into `charts/petzko-sh/values-staging.yaml` (`image.tag`), and ArgoCD
  rolls it out.
- **Prod** is promoted deliberately: bump `image.tag` in
  `charts/petzko-sh/values-prod.yaml` to the release you want live, then commit.
  Use a non-releasing commit type (e.g. `chore:`) so the promotion itself does
  not cut a new version.

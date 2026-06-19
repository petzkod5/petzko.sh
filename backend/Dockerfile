# ── build ─────────────────────────────────────────────────────────────────────
# Build natively for the target arch (no QEMU) — the runner is amd64 like the
# cluster. Stdlib-only, so there's nothing to download.
FROM --platform=$BUILDPLATFORM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
ARG TARGETOS=linux
ARG TARGETARCH=amd64
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -ldflags="-s -w" -o /resume-proxy .

# ── runtime ───────────────────────────────────────────────────────────────────
# Distroless static: no shell, no package manager, minimal CVE surface. Runs as
# the built-in nonroot user (uid 65532); the root FS can stay read-only since
# the cache lives in memory.
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /resume-proxy /resume-proxy
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/resume-proxy"]

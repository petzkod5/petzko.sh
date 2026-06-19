// resume-proxy — a tiny stdlib-only HTTP service that mirrors the latest release
// of the public resume repo. The browser can't fetch GitHub release assets
// directly (no CORS headers on the asset host), so this proxies them
// same-origin under /resume/. It queries GitHub on demand (with a short cache),
// so publishing a new resume release is reflected on the site within the TTL —
// no rebuild, no redeploy.
package main

import (
	"context"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type entry struct {
	body        []byte
	contentType string
	fetchedAt   time.Time
}

var (
	repo    = env("RESUME_REPO", "petzkod5/resume")
	assets  = parseList(env("RESUME_ASSETS", "resume-dark.pdf,resume-light.pdf"))
	ttl     = mustDur(env("CACHE_TTL", "5m"))
	addr    = ":" + env("PORT", "8080")
	fetchTO = mustDur(env("FETCH_TIMEOUT", "15s"))

	mu     sync.Mutex
	cache  = map[string]*entry{}
	client = &http.Client{Timeout: 0} // per-request timeout via context instead
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		_, _ = io.WriteString(w, "ok\n")
	})
	mux.HandleFunc("/resume/", handleResume)

	srv := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("resume-proxy listening on %s (repo=%s assets=%v ttl=%s)", addr, repo, assets, ttl)
	log.Fatal(srv.ListenAndServe())
}

func handleResume(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	name := strings.TrimPrefix(r.URL.Path, "/resume/")
	// Allowlist: only serve known release asset names. Prevents this service
	// from being used as an open fetch proxy for arbitrary paths.
	if !assets[name] {
		http.NotFound(w, r)
		return
	}

	e, err := get(r.Context(), name)
	if err != nil {
		log.Printf("resume %q: %v", name, err)
		http.Error(w, "resume unavailable", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", e.contentType)
	// Let browsers/Cloudflare hold it about as long as our own cache, so a fresh
	// release surfaces within ~one TTL window end-to-end.
	w.Header().Set("Cache-Control", "public, max-age="+itoa(int(ttl.Seconds())))
	if r.Method == http.MethodHead {
		return
	}
	_, _ = w.Write(e.body)
}

// get returns a cached asset, refreshing from GitHub when the entry is missing
// or older than the TTL. On a refresh failure it falls back to the last known
// good copy if one exists, so a GitHub blip never blanks the resume.
func get(ctx context.Context, name string) (*entry, error) {
	mu.Lock()
	cur := cache[name]
	mu.Unlock()
	if cur != nil && time.Since(cur.fetchedAt) < ttl {
		return cur, nil
	}

	fresh, err := fetch(ctx, name)
	if err != nil {
		if cur != nil {
			log.Printf("resume %q: serving stale cache after fetch error: %v", name, err)
			return cur, nil
		}
		return nil, err
	}

	mu.Lock()
	cache[name] = fresh
	mu.Unlock()
	return fresh, nil
}

// fetch pulls the asset from the latest GitHub release. The
// /releases/latest/download/<asset> URL is a plain github.com redirect (not the
// rate-limited REST API), so this needs no token and won't hit the 60/hr cap.
func fetch(ctx context.Context, name string) (*entry, error) {
	ctx, cancel := context.WithTimeout(ctx, fetchTO)
	defer cancel()

	url := "https://github.com/" + repo + "/releases/latest/download/" + name
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "resume-proxy")
	req.Header.Set("Accept", "application/octet-stream")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("upstream status " + resp.Status)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 25<<20)) // 25 MiB cap
	if err != nil {
		return nil, err
	}
	return &entry{body: body, contentType: contentType(name), fetchedAt: time.Now()}, nil
}

func contentType(name string) string {
	if strings.HasSuffix(name, ".pdf") {
		return "application/pdf"
	}
	return "application/octet-stream"
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func parseList(s string) map[string]bool {
	m := map[string]bool{}
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			m[p] = true
		}
	}
	return m
}

func mustDur(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		log.Fatalf("invalid duration %q: %v", s, err)
	}
	return d
}

func itoa(n int) string {
	if n < 0 {
		n = 0
	}
	if n == 0 {
		return "0"
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	return string(b[i:])
}

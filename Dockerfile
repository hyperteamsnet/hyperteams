# HyperTeams container image — used by docker-compose.yml in this folder.
# It copies the prebuilt Linux release for this machine's architecture
# (dist-linux-x64 or dist-linux-arm64); nothing is compiled.

FROM node:24-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ripgrep ca-certificates curl libgomp1 gcc libc6-dev \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g @anthropic-ai/claude-code

WORKDIR /app
ARG HYPERTEAMS_REPO=https://github.com/hyperteamsnet/hyperteams.git
# Changes whenever a release is published, so the clone below is not served from cache.
ADD https://github.com/hyperteamsnet/hyperteams.git/info/refs?service=git-upload-pack /tmp/release-refs
RUN case "$(uname -m)" in \
      x86_64|amd64) arch=x64 ;; \
      aarch64|arm64) arch=arm64 ;; \
      *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;; \
    esac \
 && git clone --depth 1 --branch "dist-linux-$arch" "$HYPERTEAMS_REPO" . \
 && rm -rf .git /tmp/release-refs

ENV PORT=3000 HYPERTEAMS_STATE_DIR=/data
VOLUME /data
EXPOSE 3000

CMD ["bash", "scripts/start-container.sh"]

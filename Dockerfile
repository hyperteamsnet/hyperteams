FROM node:24-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ripgrep ca-certificates curl libgomp1 gcc libc6-dev \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g @anthropic-ai/claude-code

WORKDIR /app
COPY . .

ENV PORT=3000 HYPERTEAMS_STATE_DIR=/data
VOLUME /data
EXPOSE 3000

CMD ["bash", "scripts/start-container.sh"]

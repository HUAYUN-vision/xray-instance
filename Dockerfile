# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev --ignore-scripts

# Официальный бинарник Xray из GitHub-релиза (готовые образы teddysun/ghcr отстают от релизов,
# а Trivy ловит CVE в Go-зависимостях старых версий). SHA-256 сверяется с .dgst релиза.
FROM alpine:3 AS xray
ARG TARGETARCH
ARG XRAY_VERSION=26.11.9
RUN apk add --no-cache curl unzip \
  && case "${TARGETARCH:-amd64}" in \
    amd64) ARCH=64 ;; \
    arm64) ARCH=arm64-v8a ;; \
    *) echo "unsupported arch: ${TARGETARCH}" >&2; exit 1 ;; \
  esac \
  && URL="https://github.com/XTLS/Xray-core/releases/download/v${XRAY_VERSION}/Xray-linux-${ARCH}.zip" \
  && curl -fsSLo /tmp/xray.zip "$URL" \
  && SHA=$(curl -fsSL "$URL.dgst" | sed -n 's/^SHA2-256= *//p') \
  && echo "$SHA  /tmp/xray.zip" | sha256sum -c - \
  && unzip -q /tmp/xray.zip xray -d /out \
  && chmod 755 /out/xray

FROM node:24-alpine AS runtime
# GLOBAL_PREFIX пустой: passimx-vpn-bot вызывает POST /commands без /api
ENV NODE_ENV=production \
  GLOBAL_PREFIX=""
WORKDIR /app
# npm/yarn/corepack в runtime не нужны — удаляем, чтобы уменьшить поверхность атаки (и находки Trivy)
# bash/openssl нужны скриптам xray, curl/jq — командам, которые приходят в POST /commands
RUN apk add --no-cache tini bash openssl curl jq ca-certificates \
  && apk upgrade --no-cache \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn* /usr/local/bin/yarn*
COPY --from=xray /out/xray /usr/bin/xray
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY ./xray/scripts /xray/scripts
RUN sed -i 's/\r$//' /xray/scripts/*.sh && chmod -R 755 /xray/scripts
# Контейнер работает от root: xray слушает порт 443, API — 440 (привилегированные порты),
# а /xray/data на существующих серверах создан root-ом.
EXPOSE 440 443
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${API_PORT:-${PORT:-3000}}/health/live || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/bin/bash", "/xray/scripts/start.sh"]

# Xray Server Instance

Docker-образ с [Xray](https://github.com/XTLS/Xray-core) (VLESS + Reality) и HTTP API на NestJS для управления инстансом.

Проект построен на [`HUAYUN-vision/nestjs-template`](https://github.com/HUAYUN-vision/nestjs-template).

## Стек

- **NestJS 12** + **TypeScript 6** (strict)
- **ESLint 10** (flat config, type-checked) + **Prettier**
- **Husky** + **lint-staged** + **commitlint** (Conventional Commits)
- **@nestjs/config** + **zod**: валидация env при старте
- **nestjs-pino**: структурные JSON-логи (pretty в dev)
- **@nestjs/terminus**: `/health/live`, `/health/ready`
- **Swagger**: `/docs` (включается через `SWAGGER_ENABLED=true`)
- **helmet**, CORS, глобальный `ValidationPipe`, URI-версионирование
- Глобальный exception filter с единым форматом ошибок
- **Jest** (unit + e2e), Docker, GitHub Actions CI, Dependabot

## API

| Метод  | Путь            | Описание                                                                                   |
| ------ | --------------- | ------------------------------------------------------------------------------------------ |
| `POST` | `/commands`     | `{ "commands": string[] }`: выполняет shell-команды по очереди, возвращает `stdout` каждой |
| `GET`  | `/health/live`  | liveness                                                                                   |
| `GET`  | `/health/ready` | readiness                                                                                  |

Путь `/commands` намеренно без префикса и версии (`GLOBAL_PREFIX` пустой, контроллер `VERSION_NEUTRAL`): его вызывает `passimx-vpn-bot` по адресу `http://<host>:440/commands`. Если команда завершилась с ненулевым кодом или что-то написала в `stderr`, выполнение останавливается и API отвечает `400`.

`/commands` требует заголовок `X-API-Key` со значением `API_KEY` из env (иначе `401`). Без `API_KEY` (минимум 32 символа) приложение не стартует. Сгенерировать ключ можно так: `openssl rand -hex 32`.

```bash
curl -X POST http://<host>:440/commands \
  -H 'Content-Type: application/json' -H "X-API-Key: $API_KEY" \
  -d '{"commands":["xray version"]}'
```

> ⚠️ Эндпоинт выполняет произвольные команды от root. Помимо ключа, держите порт API открытым только для управляющего сервера (firewall / allowlist).

## Xray

При старте контейнера `xray/scripts/start.sh`:

1. генерирует (если их ещё нет) в `/xray/data`: `short_id.key`, `server.name`, пару ключей x25519, `config.json`;
2. запускает `xray`;
3. восстанавливает пользователей из `/xray/data/users/*.json` (`xray api adu`);
4. запускает NestJS на порту `API_PORT` (или `PORT`).

`/xray/data` смонтирован как volume, поэтому ключи и пользователи переживают перезапуск.

## Требования

Node.js **24.9+** (см. `.nvmrc`).

## Быстрый старт

```bash
nvm use
npm install
cp .env.example .env
npm run start:dev
```

Деплой на сервер:

```bash
cp .env.example .env   # API_KEY, API_PORT, XRAY_PORT
docker compose up -d   # xray + watchtower (автообновление образа)
```

## CI/CD и версии

Пайплайн берётся из [`HUAYUN-vision/ci-cd-workflows`](https://github.com/HUAYUN-vision/ci-cd-workflows) (`@v1`), как в шаблоне:

- PR: lint, typecheck, тесты, сборка образа + Trivy, проверка заголовка PR (Conventional Commits).
- `main`: `version.yml` считает версию по коммитам с последнего тега `vX.Y.Z` (`feat` → minor, `fix`/`perf` → patch, `!`/`BREAKING CHANGE` → major), коммитит `chore(release): vX.Y.Z`, ставит тег и создаёт GitHub Release.
- После релиза образ публикуется в `ghcr.io/huayun-vision/xray-instance` с тегами `X.Y.Z`, `X.Y`, `X`, `latest`.
- На серверах watchtower следит за `:latest` и обновляет контейнер сам.

semantic-release не используется. Теги без префикса (`1.1.4` и раньше) остались от старого пайплайна, отсчёт идёт от `v1.1.4`.

## Скрипты

| Скрипт                               | Описание                       |
| ------------------------------------ | ------------------------------ |
| `npm run start:dev`                  | запуск в watch-режиме          |
| `npm run build`                      | сборка в `dist/`               |
| `npm run start:prod`                 | запуск сборки                  |
| `npm run lint` / `lint:check`        | ESLint с автофиксом / проверка |
| `npm run format` / `format:check`    | Prettier                       |
| `npm run typecheck`                  | `tsc --noEmit`                 |
| `npm test` / `test:e2e` / `test:cov` | тесты                          |

## Git-хуки

- `pre-commit` → `lint-staged` (eslint + prettier на изменённых файлах, typecheck при изменении `.ts`)
- `commit-msg` → `commitlint` (`feat: ...`, `fix(scope): ...`, `chore: ...`)

## Структура

```
src/
├── common/filters/     # глобальные фильтры
├── config/             # схема env (zod) и типизированный AppConfigService
├── modules/commands/   # POST /commands
├── modules/health/     # health-check
├── app.module.ts
├── setup-app.ts        # общая настройка приложения (main + e2e)
└── main.ts
xray/scripts/           # инициализация и запуск xray (entrypoint контейнера)
test/                   # e2e-тесты
```

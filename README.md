# Xray Server Instance

Docker-образ с [Xray](https://github.com/XTLS/Xray-core) (VLESS + Reality) и HTTP API на NestJS для управления инстансом.

Проект построен на [`HUAYUN-vision/nestjs-template`](https://github.com/HUAYUN-vision/nestjs-template) и имеет с ним общую git-историю. Обновления шаблона подтягиваются обычным `git merge` (см. ниже).

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

> ⚠️ Эндпоинт выполняет произвольные команды от root и не требует авторизации. Порт API должен быть доступен только управляющему серверу (firewall / allowlist).

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
cp .env.example .env   # API_PORT, XRAY_PORT
docker compose up -d   # xray + watchtower (автообновление образа)
```

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

## Синхронизация с шаблоном

```bash
# один раз
git remote add template https://github.com/HUAYUN-vision/nestjs-template.git
git config remote.template.tagOpt --no-tags

# каждый раз
git fetch template
git checkout -b chore/sync-template
git merge template/main
# разрешить конфликты, затем:
npm install
npm run build && npm test
git push -u origin chore/sync-template   # и открыть PR "chore: sync with nestjs-template"
```

Типичные конфликты:

- **`package.json` → `version`, `name`**: всегда оставляйте значения проекта.
- **`package-lock.json`**: не правьте руками. Возьмите любую сторону и выполните `npm install`.
- **`Dockerfile`, `docker-compose.yml`**: в проекте они расширены под xray. Переносите изменения шаблона вручную.

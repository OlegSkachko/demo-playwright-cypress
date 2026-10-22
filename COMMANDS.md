# Команды запуска

Версии: Playwright 1.49.1, Cypress 16.2.0.

## 1. Запуск проекта

```bash
docker compose up --build        # в фоне: docker compose up -d --build
docker compose down              # остановить
```

| Что | Адрес |
|---|---|
| Магазин | http://localhost:8080 |
| Django admin | http://localhost:8080/admin (`admin` / `admin`) |
| API напрямую | http://localhost:8000/api/products/ |

### Без Docker (режим разработки)

```bash
# backend
cd backend && python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate && python manage.py seed
daphne -p 8000 config.asgi:application

# frontend (в другом терминале)
cd frontend && npm install && npm run dev      # http://localhost:5173
```

## 2. Подготовка e2e (один раз)

```bash
cd e2e
npm install
npx playwright install chromium
```

Все команды ниже выполняются из папки `e2e`.

## 3. Интерактивный режим (UI)

| | Playwright | Cypress |
|---|---|---|
| UI в отдельном окне | `npm run pw:ui` | `npm run cy:ui` (в лаунчере выбрать браузер) |
| UI в браузере | `npm run pw:ui:web` → http://localhost:9323 | `npm run cy:ui:web` → сразу открывается Chrome на http://localhost:8080/__/ |

Страница Cypress `http://localhost:8080/__/` работает только в Chrome, который запустил сам Cypress, — в обычной вкладке тесты не запустятся.

## 4. Запуск тестов в консоли

### Playwright

```bash
npm run pw                                    # все тесты, без браузера (headless)
npm run pw:headed                             # все тесты с видимым браузером

npx playwright test playwright/guest.spec.js  # один файл
npx playwright test -g "UC-09"                # тесты, в названии которых есть "UC-09"
npx playwright test -g "UC-0[1-5]"            # по регулярному выражению
npx playwright test --headed -g "UC-13"       # один тест с видимым браузером
npx playwright test --debug -g "UC-09"        # пошаговая отладка в Playwright Inspector
npx playwright test --reporter=list           # подробный вывод в консоль

npm run pw:report                             # открыть HTML-отчёт последнего прогона
```

Файлы: `playwright/guest.spec.js`, `playwright/authorized.spec.js`, `playwright/notifications.spec.js`.

### Cypress

```bash
npm run cy                                    # все тесты, без браузера (headless, Electron)
npm run cy:headed                             # все тесты с видимым Chrome

npx cypress run --spec cypress/e2e/guest.cy.js                 # один файл
npx cypress run --spec "cypress/e2e/{guest,authorized}.cy.js"  # несколько файлов
npx cypress run --browser chrome                               # headless в Chrome
npx cypress run --headed --browser chrome --spec cypress/e2e/notifications.cy.js

npm run cy:report                             # открыть HTML-отчёт (mochawesome)
```

Файлы: `cypress/e2e/guest.cy.js`, `cypress/e2e/authorized.cy.js`, `cypress/e2e/notifications.cy.js`.

Фильтра по названию теста (как `-g` в Playwright) в Cypress из коробки нет — нужен плагин `@cypress/grep`. Без него один тест можно запустить, временно заменив `it(` на `it.only(`.

### Оба фреймворка подряд

```bash
npm run test:all
```

### Другой стенд и учётные данные

По умолчанию тесты идут на `http://localhost:8080` (docker compose). Адрес и тестовый аккаунт задаются переменными окружения — работает для любой команды выше:

```bash
BASE_URL=http://localhost:5173 npm run pw            # Vite dev-сервер
BASE_URL=http://localhost:5173 npm run cy:ui:web

BASE_URL=https://shop.example.com \
TEST_USER_EMAIL=qa@lumen.shop TEST_USER_PASSWORD=******** \
npm run cy
```

## 5. Unit-тесты бэкенда

```bash
docker compose exec backend python manage.py test
```

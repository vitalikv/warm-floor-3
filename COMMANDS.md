# Важные команды

## Разработка

```bash
npm install          # Установка зависимостей
npm run dev          # Запуск dev-сервера (Vite)
npm run build        # Сборка для production (TypeScript + Vite)
npm run preview      # Просмотр production сборки
```

## Git

```bash
git status           # Статус изменений
git add .            # Добавить все изменения
git commit -m "..."  # Создать коммит
git push             # Отправить изменения
git pull             # Получить изменения
```

## Claude Code (команды для AI)

```
/init                                    # Создать/обновить CLAUDE.md
Обнови CLAUDE.md с учетом последних изменений  # Обновить документацию архитектуры
Просканируй проект                       # Изучить структуру проекта
Создай коммит                            # Создать git commit с изменениями
Запусти сборку и исправь ошибки          # Build + fix errors
```

## Проект

- Dev-сервер обычно запускается на `http://localhost:5173`
- Canvas рендерится в `#canvas` элемент
- JSON данные загружаются из `/public/assets/`

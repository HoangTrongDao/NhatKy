# API Specification

Base URL: `/api/v1`

Auth:
- `POST /auth/register` JSON `{ "email": "...", "password": "...", "display_name": "..." }`
- `POST /auth/login` form fields `username` (email), `password`
- `GET /auth/me` Bearer token

Memories:
- `GET /memories`
- `POST /memories` JSON `{ "title": "...", "content": "...", "occurred_at": "2026-01-01", "visibility": "private" }`
- `GET/PATCH/DELETE /memories/{id}`

Reflections:
- `GET/POST /reflections`
- `PATCH/DELETE /reflections/{id}`

Goals:
- `GET/POST /goals`
- `PATCH/DELETE /goals/{id}`

Community:
- `GET /community/feed?limit=20&offset=0`

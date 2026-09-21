FROM node:22-bookworm-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_KAKAO_JS_KEY
ENV VITE_KAKAO_JS_KEY=$VITE_KAKAO_JS_KEY
RUN npm run build

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-render.txt ./
RUN pip install --no-cache-dir -r requirements-render.txt

COPY backend ./backend
COPY data ./data
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}

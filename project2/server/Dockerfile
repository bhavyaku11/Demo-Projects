ARG BASE_IMAGE=openenv-base:latest
FROM ${BASE_IMAGE} AS builder

WORKDIR /app/env
COPY . /app/env

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-install-project --no-editable || true
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-editable

FROM ${BASE_IMAGE}

WORKDIR /app/env
COPY --from=builder /app/env /app/env

ENV PATH="/app/env/.venv/bin:$PATH"
ENV PYTHONPATH="/app/env:$PYTHONPATH"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["sh", "-c", "cd /app/env && uv run server --host 0.0.0.0 --port 8000"]


# ==========================================
# STAGE 1: Builder
# ==========================================
FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libsodium-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy source code and bundled dependencies
COPY . .

# Build release binary
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build

# ==========================================
# STAGE 2: Minimal Runtime
# ==========================================
FROM ubuntu:24.04 AS runner

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libsodium23 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy compiled binary and frontend assets
COPY --from=builder /app/build/securevault_server /app/securevault_server
COPY --from=builder /app/frontend /app/frontend

# Create data directory for SQLite database
RUN mkdir -p /app/data

ENV PORT=8080
EXPOSE 8080

CMD ["/app/securevault_server"]

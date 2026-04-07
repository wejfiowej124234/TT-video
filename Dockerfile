# API 部署镜像（traveltrust-api）；与 CI 一致可注入 TRAVELTRUST_BUILD_GIT_SHA。
FROM rust:1-bookworm AS builder
WORKDIR /app
ARG TRAVELTRUST_BUILD_GIT_SHA=
ENV TRAVELTRUST_BUILD_GIT_SHA=${TRAVELTRUST_BUILD_GIT_SHA}
COPY Cargo.toml ./
COPY crates ./crates
RUN cargo build --release -p traveltrust-api

FROM debian:bookworm-slim
ARG TRAVELTRUST_BUILD_GIT_SHA=
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libssl3 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/traveltrust-api /usr/local/bin/traveltrust-api
LABEL org.opencontainers.image.revision="${TRAVELTRUST_BUILD_GIT_SHA}"
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/traveltrust-api"]

FROM alpine:3.20
RUN apk add --no-cache bash curl ca-certificates nodejs
WORKDIR /app
COPY soak-probe-loop.sh entrypoint.sh ./
RUN chmod +x soak-probe-loop.sh entrypoint.sh
ENV SOAK_DATA_DIR=/data/soak
CMD ["./entrypoint.sh"]

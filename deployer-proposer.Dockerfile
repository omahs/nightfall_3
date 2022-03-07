FROM node:14.17

WORKDIR /app
COPY common-files common-files
COPY config/default.js config/default.js
COPY config/default.js /app/test/ping-pong/proposer/config/default.js
COPY cli cli
WORKDIR /app/common-files
RUN npm ci
WORKDIR /app/cli
RUN npm ci

WORKDIR /app/test/ping-pong/proposer
RUN apt-get update -y
RUN apt-get install -y netcat-openbsd
COPY test/ping-pong/proposer/package*.json ./
COPY test/ping-pong/proposer/src src
COPY genesis-blocks/docker-entrypoint.sh docker-entrypoint.sh

# websocket port 8080
EXPOSE 8080

RUN npm ci
ENTRYPOINT ["/app/test/ping-pong/proposer/docker-entrypoint.sh"]

CMD ["npm", "start"]
FROM oven/bun:debian

ENV NODE_ENV="production"

WORKDIR /app

COPY . .

COPY --from=node:23 /usr/local/bin/node /usr/local/bin/node

RUN bun install --verbose

RUN bunx prisma generate

CMD [ "bun", "run", "start" ]

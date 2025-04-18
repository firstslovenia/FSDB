FROM oven/bun:debian

ENV NODE_ENV="production"

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package.json package.json

COPY bun.lockb bun.lockb 

COPY --from=node:23 /usr/local/bin/node /usr/local/bin/node

RUN bun install --verbose

COPY . .

RUN bunx prisma generate

CMD ["sh", "-c", "bunx prisma migrate deploy && bun index.ts"]
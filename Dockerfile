FROM node:24-alpine AS base

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS development

ENV NODE_ENV=development

CMD ["pnpm", "start:dev"]

FROM base AS build

COPY . .
RUN pnpm build
RUN pnpm prune --prod --ignore-scripts

FROM node:24-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

RUN mkdir -p uploads && chown -R node:node uploads

USER node

CMD ["node", "dist/src/main"]
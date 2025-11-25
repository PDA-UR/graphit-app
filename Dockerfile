ARG NODE_VERSION=22.5.1

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /opt


COPY ./api ./api
COPY ./frontend ./frontend
COPY package.json package-lock.json processes.config.js ./
# also use the package-json.lock to keep all dependency-versions consistant

RUN npm install
RUN npm install @tsed/cli@5.2.0
# was previously global install, but: packages switched to esm-only
# and will install the wrong versions of the @tsed-dependencies like that

RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runtime
ENV WORKDIR=/opt
WORKDIR $WORKDIR

COPY --from=build /opt .

RUN npm install --production
RUN npm install -g pm2
RUN apk update && apk add build-base git curl

EXPOSE 8081
ENV PORT=8081
ENV NODE_ENV=production

CMD ["pm2-runtime", "start", "processes.config.js", "--env", "production"]

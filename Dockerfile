ARG NODE_VERSION=18.7.0

FROM node:${NODE_VERSION}-alpine as build
WORKDIR /opt


COPY ./api ./api
COPY ./frontend ./frontend
COPY package.json processes.config.js ./

RUN npm install
RUN npm install -g @tsed/cli

RUN npm run build

FROM node:${NODE_VERSION}-alpine as runtime
ENV WORKDIR /opt
WORKDIR $WORKDIR

COPY --from=build /opt .

RUN npm install --production
RUN npm install -g pm2
RUN apk update && apk add build-base git curl

EXPOSE 8081
ENV PORT 8081
ENV NODE_ENV production

CMD ["pm2-runtime", "start", "processes.config.js", "--env", "production"]

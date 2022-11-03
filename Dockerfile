FROM node:18.10.0-slim

WORKDIR /app
RUN apt-get update && apt-get install -y autoconf git

COPY ./build /app/build
COPY ./copy /app/copy
COPY ./client /app/client
COPY ./content /app/content
COPY ./kumascript /app/kumascript
COPY ./libs /app/libs
COPY ./markdown /app/markdown
COPY ./server /app/server
COPY ./ssr /app/ssr
COPY ./tool /app/tool
COPY package.json /app
COPY tsconfig.dist.json /app
COPY tsconfig.json /app
COPY yarn.lock /app
RUN cd /app
RUN yarn install --frozen-lockfile
RUN mkdir /mdn_content && cd /mdn_content && git clone https://github.com/mdn/content.git
RUN cd /app
ENV CONTENT_ROOT=/mdn_content/content/files
RUN yarn build:prepare
ENTRYPOINT [ "yarn","start:dev-server"]


FROM node:16-alpine3.16

RUN echo "https://mirrors.aliyun.com/alpine/v3.6/main/" > /etc/apk/repositories \
    && apk update \
    && apk add bash ffmpeg \
    && yarn global add pm2@4.5.0

WORKDIR /app
COPY . /app
EXPOSE 3001

ENTRYPOINT bash /app/entry-point.sh
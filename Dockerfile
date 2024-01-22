# Judger node for c++
FROM alpine:latest AS cpp

RUN apk --update --no-cache add g++ nodejs npm

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]

# Judger node for java
FROM alpine:latest AS java

RUN apk --update --no-cache add openjdk11 nodejs npm

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
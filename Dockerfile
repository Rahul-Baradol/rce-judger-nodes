# Judger node for c++
FROM alpine:latest AS cpp

RUN apk --update --no-cache add g++ nodejs npm

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]

# Judger node for python
FROM alpine:latest AS py

RUN apk --update --no-cache add python3 py3-pip nodejs npm

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
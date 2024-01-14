FROM node:20-alpine

RUN apk add --no-cache build-base

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
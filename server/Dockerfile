FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
RUN npm run build:admin
RUN npm run build
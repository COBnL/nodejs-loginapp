FROM node:9.8.0-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]

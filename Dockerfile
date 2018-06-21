FROM node:8.11.3-alpine
COPY . /app
WORKDIR /app
CMD [ "node", "/app/lib/run.js" ]


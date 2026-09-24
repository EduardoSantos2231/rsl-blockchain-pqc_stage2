# Same Node version for dev, tests and CI.
FROM node:22.14-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
# The source is bind-mounted by docker-compose; node_modules stays in the image.
USER node

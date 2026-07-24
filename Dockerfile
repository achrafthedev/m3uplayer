# Dev/build image. Use `docker compose up` for local dev with hot reload,
# or `docker build --target build -o dist .` to produce a static dist/ folder.

FROM node:26-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM base AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS build
COPY . .
RUN npm run build

FROM nginx:alpine AS preview
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

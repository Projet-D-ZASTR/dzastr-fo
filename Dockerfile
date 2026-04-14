# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_AUTH_API_URL=http://localhost:8081/api
ARG VITE_AUTH_SERVICE_TOKEN
ARG VITE_MO_API_URL=/mo-api
ARG VITE_MO_SERVICE_TOKEN=cuisdjghfhbyu67578uhybgb7886
ENV VITE_AUTH_API_URL=${VITE_AUTH_API_URL}
ENV VITE_AUTH_SERVICE_TOKEN=${VITE_AUTH_SERVICE_TOKEN}
ENV VITE_MO_API_URL=${VITE_MO_API_URL}
ENV VITE_MO_SERVICE_TOKEN=${VITE_MO_SERVICE_TOKEN}
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


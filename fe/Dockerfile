# frontend/Dockerfile

# Stage 1 - build
FROM node:20 AS builder
WORKDIR /app

# Copy and install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Inject environment variable at build-time
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
# Inject build-time .env
ARG VITE_API_BASE_URL=https://api.rutayba.com
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env.production

# Build the frontend
RUN npm run build

# Stage 2 - Serve static files with nginx
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80

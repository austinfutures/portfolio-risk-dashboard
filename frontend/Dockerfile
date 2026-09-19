# Step 1: Build the Vite React application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Step 2: Serve application using Nginx
FROM nginx:alpine

# Copy built static files to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Expose Nginx web server port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
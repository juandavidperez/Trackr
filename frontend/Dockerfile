# ── Stage 1: Build ────────────────────────────────────
FROM node:24-alpine AS build

ARG API_URL=/api
WORKDIR /app

# Cache dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Build the application
COPY . .
RUN npx ng build --configuration production --output-mode static --no-ssr

# Replace API_URL placeholder with actual value
RUN find dist/ -name '*.js' -exec sed -i "s|__API_URL__|${API_URL}|g" {} +

# ── Stage 2: Serve ───────────────────────────────────
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

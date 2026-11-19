# ── Stage 1 : build Angular ─────────────────────────────────────────────────
FROM node:24-alpine AS build

# URL de l'API injectée dans le bundle. Par défaut "/api" (chemin relatif) :
# nginx fait proxy vers le backend, donc la même image fonctionne partout
# (Docker Compose, Minikube, EKS). netlify.toml utilise le même mécanisme.
ARG API_URL=/api
WORKDIR /app

# Dépendances d'abord : cette couche reste en cache tant que package*.json ne change pas.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Angular (projet configuré pour le SSR) produit index.csr.html alors que nginx
# attend index.html : on le renomme, et le build échoue si index.html manque.
RUN npx ng build --configuration production --output-mode static --no-ssr \
    && find dist/ -name '*.js' -exec sed -i "s|__API_URL__|${API_URL}|g" {} + \
    && cd dist/frontend/browser \
    && if [ -f index.csr.html ]; then mv index.csr.html index.html; fi \
    && test -f index.html

# ── Stage 2 : nginx non-root ────────────────────────────────────────────────
# Image officielle « unprivileged » : nginx tourne sous l'UID 101, écoute sur 8080.
FROM nginxinc/nginx-unprivileged:1.29-alpine

# Adresse du backend vue depuis le conteneur nginx (surchargée par Compose ou Kubernetes).
ENV BACKEND_URL=http://backend:8080

# On supprime la page « Welcome to nginx! » et la config par défaut de l'image.
USER root
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf
USER 101

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

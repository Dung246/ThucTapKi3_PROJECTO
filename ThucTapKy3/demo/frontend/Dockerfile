# --- Build stage: Node + Vite production build ---
FROM node:24-alpine AS build
WORKDIR /app

# Copy only package manifests first so this layer is cached and skipped on rebuilds that only change
# src/. Using `npm install` rather than `npm ci`: the lockfile was generated on Windows, and Rollup's
# optional platform-native-binding entries differ from what Linux/Alpine needs, which makes `npm ci`'s
# strict lockfile-match check fail here even though the dependency tree itself is fine - a well-known
# cross-OS npm lockfile quirk, not an actual drift between package.json and package-lock.json.
COPY package.json package-lock.json ./
RUN npm install

COPY . .
# No VITE_API_BASE_URL set here on purpose: Vite bakes env vars in at build time, and the default in
# src/services/api.js ("http://localhost:8080/api") is exactly right for a browser running on the
# host - the browser can't resolve the Docker-internal "backend" service name, only localhost:8080
# (the host port mapping), so leaving this unset is correct, not an oversight.
RUN npm run build

# --- Runtime stage: slim Nginx serving the static build ---
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

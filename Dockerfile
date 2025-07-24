# ---- 1. Base image ------------------------------------------------
FROM nginx:stable-alpine-slim

# ---- 2. Runtime layer ---------------------------------------------
WORKDIR /usr/share/nginx/html

# Copy custom server config
COPY src/configs/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled angular bundle
COPY dist .

# ---- 3. Container runtime settings --------------------------------
ENV PORT=80
ENV PORT_SSL=443
EXPOSE 80 443

# ---- 4. Replace env file and start the NestJS server --------------
CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/assets/scripts/env.template.js > /usr/share/nginx/html/assets/scripts/env.js && exec nginx -g 'daemon off;'"]

FROM nginx:1.27-alpine

# Delete default config so it doesn’t conflict
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy global NGINX config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy all service-level route configs
COPY conf.d /etc/nginx/conf.d

# Optional: custom error pages
# COPY errors /usr/share/nginx/html/errors

# Ensure correct permissions
RUN chmod -R 755 /etc/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

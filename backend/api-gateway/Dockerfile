FROM nginx:alpine

# 1. Clear default configs
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copy the main config
# Path is relative to the Dockerfile: nginx/nginx.conf
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# 3. Copy the service route files
# Path is relative to the Dockerfile: nginx/conf.d/
COPY nginx/conf.d/ /etc/nginx/conf.d/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
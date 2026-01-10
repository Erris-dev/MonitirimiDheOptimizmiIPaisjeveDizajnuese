FROM nginx:alpine

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy your main config (the one that includes conf.d/*.conf)
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy all your service-specific routes (auth.conf, ingest.conf, anal.conf)
COPY nginx/conf.d/ /etc/nginx/conf.d/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
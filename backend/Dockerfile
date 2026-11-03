FROM php:8.2-fpm-alpine

RUN apk add --no-cache curl git unzip libzip-dev zip ffmpeg python3 py3-pip && docker-php-ext-install zip pdo pdo_mysql && pip3 install --no-cache-dir --break-system-packages yt-dlp==2026.10.26

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

EXPOSE 9000

CMD [ "php-fpm" ]



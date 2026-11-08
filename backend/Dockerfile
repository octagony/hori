FROM node:20-alpine AS base

# hadolint ignore=DL3018
RUN apk add --no-cache \
        bash \
        curl \
        ffmpeg \
        python3 \
        py3-pip

RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /var/www

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS runner
COPY --from=deps /var/www/node_modules ./node_modules
COPY . .

RUN mkdir -p /var/www/storage/downloads

EXPOSE 3000

CMD ["npm", "run", "dev"]
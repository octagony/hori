FROM node:20-alpine AS base

RUN apk add --no-cache \
        bash \
        curl \
        ffmpeg \
        python3 \
        py3-pip

ARG YTDLP_VERSION=2026.10.26

RUN pip3 install --no-cache-dir --break-system-packages "yt-dlp==${YTDLP_VERSION}"

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
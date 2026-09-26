# Xwégán — image de production autonomome (option Render / VPS sans Node).
#
# Build :  docker build --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
#                --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... -t xwegan .
# Run :    docker run --env-file .env.local -p 3000:3000 xwegan
#
# L'image embarque les dépendances + le build ; --env-file fournit TOUTES les
# variables à l'exécution (jamais dans l'image) — y compris les NEXT_PUBLIC_*,
# que le serveur relit aussi au runtime. Même variables que .env.example.
#
# Équivalent exact de ce que fait deploy.sh sur le VPS (npm ci + build +
# next start), sans Node à installer sur l'hôte.

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dépendances : calque séparé pour profiter du cache Docker tant que
# package.json / package-lock.json ne bougent pas.
FROM base AS dependances
COPY package.json package-lock.json ./
RUN npm ci

# Build de production. Les NEXT_PUBLIC_* doivent être présents ici : ils sont
# figés dans le JS servi au navigateur. Les autres variables (clé de service,
# ADMIN_*, KKIAPAY_*) sont lues à l'exécution et peuvent arriver plus tard.
FROM base AS construction
# DOCKER_BUILD=1 active la sortie standalone (voir next.config.ts) : Vercel
# et `next start` restent sur la sortie standard.
ARG DOCKER_BUILD=1
# Valeurs publiques figées au build (`docker build --build-arg ...`). Les
# secrets (clé de service, ADMIN_*, GENIUSPAY_* privés) arrivent à l'exécution.
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""
COPY --from=dependances /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Exécution : démarre `next start`, comme le service systemd `immo`.
FROM base AS execution
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=construction /app/public ./public
COPY --from=construction --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=construction --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled source (run `npm run build` before building image)
COPY dist/ ./dist/

EXPOSE 3001

CMD ["node", "dist/index.js"]

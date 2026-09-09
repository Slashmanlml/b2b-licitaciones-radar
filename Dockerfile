FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY index.js ./
COPY src/ ./src/
COPY data/ ./data/
CMD ["npm", "start"]

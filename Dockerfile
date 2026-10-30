FROM node:20-alpine

# Git install karne (enoent git error fix sathi)
RUN apk add --no-cache git

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]

# Node.js official lightweight image
FROM node:20-alpine

# Working directory set karne
WORKDIR /app

# Package files copy karne
COPY package*.json ./

# Dependencies install karne
RUN npm install

# Baaki sagle files copy karne
COPY . .

# Port expose karne
EXPOSE 3000

# Server start karne
CMD ["npm", "start"]

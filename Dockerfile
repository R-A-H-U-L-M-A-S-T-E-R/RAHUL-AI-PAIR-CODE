FROM quay.io/a-s-w-i-n-s-p-a-r-k-y/rahul-ai:latest

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]

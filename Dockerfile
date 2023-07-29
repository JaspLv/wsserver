FROM node:18 as main
RUN apt-get update && apt-get upgrade -y

FROM main as dependencies
WORKDIR /application
COPY package.json package-lock.json ./
RUN npm install

FROM main as app
WORKDIR /application
COPY . .
COPY --from=dependencies /application/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]

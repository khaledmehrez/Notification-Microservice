FROM node:lts
COPY . .


CMD npm run start:prod

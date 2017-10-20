FROM node:8.7.0
LABEL author="han_x"

COPY main.js package.json /app/
COPY lib/ /app/lib/
COPY node_modules/ /app/node_modules/

WORKDIR /app

CMD [ "node", "main.js" ]
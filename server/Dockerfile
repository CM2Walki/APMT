FROM node:10.16.0-alpine

# Bundle app source
# Create app directory
COPY . /usr/src/ScaleX/

# Install app dependencies
RUN set -x \
        && npm install

WORKDIR /usr/src/ScaleX

EXPOSE 8080

CMD [ "node", "index.js"]

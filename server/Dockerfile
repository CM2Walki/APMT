FROM node:10.16.0-alpine

# Bundle app source
# Create app directory
COPY . /usr/src/apmt/

# Install app dependencies
RUN set -x \
        && npm install

WORKDIR /usr/src/apmt

EXPOSE 8080

CMD [ "node", "index.js"]

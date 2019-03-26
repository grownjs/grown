# development utilities
FROM mhart/alpine-node:11 as nodejs
  RUN apk update && apk add make git sudo python-dev py-pip curl jq
  RUN npm i -g npm@latest new-port-cli node-wait-for-it
  RUN pip install awscli


# install docker and setup environment
FROM nodejs as develop
  RUN apk add docker
  RUN pip install docker-compose==1.23.2
  RUN npm i -g ndb nodemon eclint eslint eslint-plugin-import eslint-config-airbnb-base

  RUN adduser -u 1000 -G root -D dev
  RUN echo "dev ALL=NOPASSWD: ALL" > /etc/sudoers.d/dev && \
    chmod 0440 /etc/sudoers.d/dev

  USER dev
  WORKDIR /home/dev/src

  RUN apk add bash-completion postgresql-client

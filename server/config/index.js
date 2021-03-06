// config.js
// This file contains private configuration details.
module.exports = {
  "mongodb": {
    "host": process.env.MONGODB_HOST,
    "port": "27017",
    "dbUsersData": {
      "name": "dbUsersData",
      "collectionName": "usersData",
    },
    "dbKubernetesTestData": {
      "name": "dbKubernetes"
    },
    "dbawsAutoscale": {
      "name": "dbawsAutoscale"
    },
    "dbawsKubeAutoscale": {
      "name": "dbawsKubeAutoscale"
    }
  },
  "server": {
        "port": "8080",
        "host": "localhost"
    }
};






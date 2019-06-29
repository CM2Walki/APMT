const Q                 = require('q');
const config            = require('../../../config');

// MongoDB connection information
const mongodbUrlKubeConfig = 'mongodb://'+ config.mongodb.host + ':'+config.mongodb.port+'/'+config.mongodb.dbUsersData.name;
const collectionNameKubeConfig = config.mongodb.dbUsersData.collectionName;

const mongodbUrlKubeTestData = 'mongodb://'+config.mongodb.host + ':'+config.mongodb.port+'/'+config.mongodb.dbKubernetesTestData.name;
const MongoClient = require('mongodb').MongoClient;

exports.getInstancesId = function(username) {
  const deferred = Q.defer();
  let ids = [];
  MongoClient.connect(mongodbUrlKubeConfig, function (err, db) {
    const collection = db.collection(collectionNameKubeConfig);
    //check if username is already assigned in our database
    collection.findOne({'userInfo.username' : username})
      .then(function (result) {
        if (null != result)
        {
          const masterId = result["awsKubernetes"]["kubernetesConfig"].master.instanceid;
          const minionIds = result["awsKubernetes"]["kubernetesConfig"].minionIds;
          ids = minionIds;
          ids.push(masterId);
          deferred.resolve(ids);
        }
        else
        {
          console.log("user Not exists:", username);
          deferred.resolve(ids);
        }
      });
  });
  return deferred.promise;
};

exports.getMasterIp = function(username) {
  const deferred = Q.defer();

  MongoClient.connect(mongodbUrlKubeConfig, function (err, db) {
    const collection = db.collection(collectionNameKubeConfig);

    //check if username is already assigned in our database
    collection.findOne({'userInfo.username' : username})
      .then(function (result) {
        if (null != result)
        {
          const ip = result["awsKubernetes"]["kubernetesConfig"].master.ip;
          deferred.resolve(ip); // username exists
        }
        else
        {
          console.log("user Not exists:", username);
          deferred.resolve(false); // username not exists
        }
      });
  });
  return deferred.promise;
};

exports.setManualRecording = function (username, data) {
  const deferred = Q.defer();
  MongoClient.connect(mongodbUrlKubeConfig, function (err, db) {
    let collection = db.collection(collectionNameKubeConfig);
    collection.findOne({'userInfo.username' : username})
      .then(function (result) {
        if (null != result )
        {
          if(data) {
            collection.update({'userInfo.username': username},
              {
                $set: {
                  "kubernetes.manualRecording": data,
                }
              },
              {upsert: false});
            MongoClient.connect(mongodbUrlKubeTestData, function (err, db) {
              let collectionName = 'manualData' + username;

              db.listCollections({name: collectionName})
                .next(function(err, collinfo) {
                  if (collinfo) {
                    // The collection exists
                    db.collectionName.drop();
                  }
                });
            });
          }
          else
          {
            collection.update({'userInfo.username': username},
              {
                $set: {
                  "kubernetes.manualRecording": data
                }
              },
              {upsert: false});
          }
          deferred.resolve(true); // username exists
        }
        else
        {
          deferred.resolve(false); // username not exists
        }
      });
  });
  return deferred.promise;
};

exports.getManualRecording = function(username) {
  const deferred = Q.defer();
  MongoClient.connect(mongodbUrlKubeConfig, function (err, db) {
    const collection = db.collection(collectionNameKubeConfig);
    //check if username is already assigned in our database
    collection.findOne({'userInfo.username' : username})
      .then(function (result) {
        if (null != result)
        {
          const value = result["awsKubernetes"]["manualRecording"];
          deferred.resolve(value);
        }
        else
        {
          console.log("user Not exists:", username);
          deferred.resolve(false);
        }
      });
  });
  return deferred.promise;
};

exports.setLoadTestRecording = function (username, testName, data) {
  const deferred = Q.defer();
  MongoClient.connect(mongodbUrlKubeConfig, function (err, db) {
    let collection = db.collection(collectionNameKubeConfig);

    collection.findOne({'userInfo.username' : username})
      .then(function (result) {
        if (null != result )
        {
          if(data) {
            collection.update({'userInfo.username': username},
              {
                $set: {
                  ["awsKubernetes."+testName+".enable"]: data
                }
              },
              {upsert: false});

            MongoClient.connect(mongodbUrlKubeTestData, function (err, dbin) {
              const collectionNameRequestData = testName + 'requestData' + username;
              const collectionNameKubeData = testName + 'kubernetesData' + username;

              dbin.listCollections({name: collectionNameRequestData})
                .next(function(err, collinfo) {
                  if (collinfo) {
                    // The collection exists
                    console.log(collinfo);
                    var collection = dbin.collection(collectionNameRequestData);
                    collection.drop();
                  }
                });
              dbin.listCollections({name: collectionNameKubeData})
                .next(function(err, collinfo) {
                  if (collinfo) {
                    // The collection exists
                    console.log(collinfo);
                    var collection = dbin.collection(collectionNameKubeData);
                    collection.drop();
                  }
                });
            });
          }
          else
          {
            collection.update({'userInfo.username': username},
              {
                $set: {
                  "kubernetes.manualRecording": data
                }
              },
              {upsert: false})
          }
          deferred.resolve(true); // username exists
        }
        else
        {
          deferred.resolve(false); // username not exists
        }
      });
  });
  return deferred.promise;
};

exports.addRecordedData = function (username, data) {
  const deferred = Q.defer();
  MongoClient.connect(mongodbUrlKubeTestData, function (err, db) {
    const collectionNameManualData = 'manualData' + username;
    let collection = db.collection(collectionNameManualData);
    collection.insert(data)
      .then(function () {
        db.close();
        deferred.resolve(true);
      });
  });
  return deferred.promise;
};

exports.addLoadTestKubernetesData = function (username, testName, data) {
  const deferred = Q.defer();
  MongoClient.connect(mongodbUrlKubeTestData, function (err, db) {
    const collectionNameKubeData = testName + 'kubernetesData' + username;
    let collection = db.collection(collectionNameKubeData);
    collection.insert(data)
      .then(function () {
        db.close();
        deferred.resolve(true);
      });
  });
  return deferred.promise;
};

exports.addLoadTestRequestData = function (username,testName,data) {
  const deferred = Q.defer();
  MongoClient.connect(mongodbUrlKubeTestData, function (err, db) {
    const collectionNameRequestData = testName + 'requestData' + username;
    let collection = db.collection(collectionNameRequestData);
    collection.insert(data)
      .then(function () {
        db.close();
        deferred.resolve(true);
      });
  });
  return deferred.promise;
};

exports.getRequestTestData = function(username, testName) {
  const deferred = Q.defer();
  let dataAll = [];
  MongoClient.connect(mongodbUrlKubeTestData, function (err, db) {
    const collectionNameRequestData = testName + 'requestData' + username;
    const collection = db.collection(collectionNameRequestData);

    collection.find({}).toArray(function (err,result) {
        if (result.length)
        {
          dataAll=result;
          deferred.resolve(dataAll); // username exists
        }
        else
        {
          deferred.resolve(dataAll); // username not exists
        }
      });
  });
  return deferred.promise;
};

exports.getLoadKubernetesData = function(username, testName) {
  const deferred = Q.defer();
  let dataAll = [];
  MongoClient.connect(mongodbUrlKubeTestData, function (err, db) {
    const collectionNameKubeData = testName + 'kubernetesData' + username;
    const collection = db.collection(collectionNameKubeData);

    collection.find({}).toArray(function (err, result) {
      if (result.length)
      {
        dataAll = result;
        deferred.resolve(dataAll); // username exists
      }
      else
      {
        deferred.resolve(dataAll); // username not exists
      }
    });
  });
  return deferred.promise;
};

exports.getLoadTestTimelineData = function(username, testName) {
  const deferred = Q.defer();
  let dataAll = [];
  MongoClient.connect(mongodbUrlKubeTestData, function (err, db) {
    const collectionNameKubeData = testName + 'kubernetesData' + username;
    const collection = db.collection(collectionNameKubeData);

    collection.find({}).toArray(function (err, result) {
      if (result.length)
      {
        let eventsArr = [];
        for(let i=0; i<result.length; i++)
        {
          for(let j=0; j < result[i].data.eventsInfo.length; j++) {
            eventsArr.push(result[i].data.eventsInfo[j]);
          }
        }
        dataAll = eventsArr;
        deferred.resolve(dataAll); // username exists
      }
      else
      {
        deferred.resolve(dataAll); // username not exists
      }
    });
  });
  return deferred.promise;
};

exports.savePodInfo = function (data, collectionName) {
  const deferred = Q.defer();

  MongoClient.connect(mongodbUrlKubeConfig, function (err, db) {
    let collection = db.collection(collectionName);

    collection.insert(data)
      .then(function () {
        db.close();
        deferred.resolve(true);
      });
  });
  return deferred.promise;
};

exports.saveLoadTestData = function(loadTestData,collectionName) {
  let data = {};
  const latency = loadTestData.latency;
  const result = loadTestData.result;
  const error = loadTestData.error;
  if(result) {
    data = {
      "latency": latency,
      "result": result,
      "error": error,
      "requestElapsed": result.requestElapsed,
      "requestIndex": result.requestIndex,
      "instanceIndex": result.instanceIndex
    };
  }
  else
  {
    data = {
      "latency": latency,
      "result": result,
      "error": error,
      "requestElapsed":'',
      "requestIndex": '',
      "instanceIndex": ''
    };
  }
  const deferred = Q.defer();

  MongoClient.connect(mongodbUrlKubeConfig, function (err, db) {
    let collection = db.collection(collectionName);
    collection.save(data)
      .then(function () {
        db.close();
        deferred.resolve(true);
      });
  });
  return deferred.promise;
};

exports.initLoadTest = function (collectionName) {
  const deferred = Q.defer();

  MongoClient.connect(mongodbUrlKubeConfig, function (err, db) {
    db.listCollections({name: collectionName})
      .next(function (err, collinfo) {
        if (collinfo) {
          let collection = db.collection(collectionName);
          collection.drop()
            .then(function () {
              db.close();
              deferred.resolve(true);
            });
        }
        else{
          console.log("not present");
          deferred.resolve(true);
        }
      });
  });
  return deferred.promise;
};

const Q                 = require('q');
const config            = require('../../../config');

// MongoDB connection information
const mongodbUrlConfig = 'mongodb://'+ config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.dbUsersData.name;
const collectionNameConfig = config.mongodb.dbUsersData.collectionName;

const mongodbUrlAwsAutoScaleTestData = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.dbawsAutoscale.name;
const MongoClient = require('mongodb').MongoClient;

exports.addLoadBalancerDns = function (username, dns) {
  var deferred = Q.defer();
  MongoClient.connect(mongodbUrlConfig, function (err, db) {
    var collection = db.collection(collectionNameConfig);
    collection.findOne({'userInfo.username' : username})
      .then(function (result) {
        if (null != result)
        {
          collection.update({'userInfo.username' : username},
            {
              $set : {
                "awsAutoScale.awsAutoscaleConfig.loadbaldns": dns
              }
            },
            {upsert:false});
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

exports.addCurrentRecordedData = function (username,data) {
  MongoClient.connect(mongodbUrlAwsAutoScaleTestData, function (err, db) {
    var collectionNameCurrentData = 'currentData' + username;
    var collection = db.collection(collectionNameCurrentData);
    collection.insert(data)
      .then(function () {
        db.close();
      });
  });
};

exports.setLoadTestRecording = function (username,testName,data) {
  var deferred = Q.defer();
  MongoClient.connect(mongodbUrlConfig, function (err, db) {
    var collection = db.collection(collectionNameConfig);
    collection.findOne({'userInfo.username' : username})
      .then(function (result) {
        if (null != result )
        {
          if(data) {
            collection.update({'userInfo.username': username},
              {
                $set: {
                  ["awsAutoScale." + testName + ".enable"]: data
                }
              },
              {upsert: false});

            MongoClient.connect(mongodbUrlAwsAutoScaleTestData, function (err, db) {
              let collectionNameRequestData = testName + 'requestData' + username;

              console.log(collectionNameRequestData);
              db.listCollections({name: collectionNameRequestData})
                .next(function(err, collinfo) {
                  if (collinfo) {
                    // The collection exists
                    console.log(collinfo);
                    var collection = db.collection(collectionNameRequestData);
                    collection.drop();
                  }
                });
              collectionNameRequestData = testName + 'autoscaleData' + username;

              db.listCollections({name: collectionNameRequestData})
                .next(function(err, collinfo) {
                  if (collinfo) {
                    // The collection exists
                    console.log(collinfo);
                    var collection = db.collection(collectionNameRequestData);
                    collection.drop();
                  }
                });
              deferred.resolve(true); // username exists
            });
          }
        }
        else
        {
          deferred.resolve(false); // username not exists
        }
      });
  });
  return deferred.promise;
};

exports.addLoadTestRequestData = function (username,testName,data) {
  var deferred = Q.defer();
  MongoClient.connect(mongodbUrlAwsAutoScaleTestData, function (err, db) {
    var collectionNameRequestData = testName + 'requestData' + username;
    console.log(collectionNameRequestData);
    var collection = db.collection(collectionNameRequestData);
    collection.insert(data)
      .then(function () {
        db.close();
        deferred.resolve(true);
      });
  });
  return deferred.promise;
};

exports.addAutoscalingData = function (username,testName,data) {
  var deferred = Q.defer();
  MongoClient.connect(mongodbUrlAwsAutoScaleTestData, function (err, db) {
    var collectionNameRequestData = testName + 'autoscaleData' + username;
    console.log(collectionNameRequestData);
    var collection = db.collection(collectionNameRequestData);
    collection.insert(data)
      .then(function () {
        db.close();
        deferred.resolve(true);
      });
  });
  return deferred.promise;
};

exports.getTestData = function(username,testName) {
  var deferred = Q.defer();
  var dataAll = [];
  MongoClient.connect(mongodbUrlAwsAutoScaleTestData, function (err, db) {
    var collectionNameRequestData = testName + 'requestData' + username;
    var collection = db.collection(collectionNameRequestData);

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

exports.getAutoscalingData = function(username,testName) {
  var deferred = Q.defer();
  var dataAll = [];
  MongoClient.connect(mongodbUrlAwsAutoScaleTestData, function (err, db) {
    var collectionNameRequestData = testName + 'autoscaleData' + username;
    var collection = db.collection(collectionNameRequestData);

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

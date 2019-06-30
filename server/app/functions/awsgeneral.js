const Q                 = require("q");
const config            = require("../../config");
const AWS               = require("aws-sdk");

// MongoDB connection information
const mongodbUrlConfig = "mongodb://"+ config.mongodb.host + ":" + config.mongodb.port + "/"
                                        + config.mongodb.dbUsersData.name;
const collectionNameConfig = config.mongodb.dbUsersData.collectionName;

const MongoClient = require("mongodb").MongoClient;

exports.addConfigData = function (username, data, context) {
  const deferred = Q.defer();
  MongoClient.connect(mongodbUrlConfig, function (err, db) {
    let collection = db.collection(collectionNameConfig);
    collection.findOne({"userInfo.username" : username})
      .then(function (result) {
        if (null != result)
        {
          collection.update({"userInfo.username" : username},
            {
              $set : {
                [context + ".awsAutoscaleConfig"]: data
              }
            },
            {upsert: false});
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

exports.getUserInfoForDeploy = function (username, res, req, context) {
  MongoClient.connect(mongodbUrlConfig, function (err, db) {
    const collection = db.collection(collectionNameConfig);
    //check if username is already assigned in our database
    collection.findOne({"userInfo.username" : username})
      .then(function (result) {
        if (null != result) {
          res.render(context + "/deploy", {
            layout: "../" + context + "/layouts/main",
            user: username,
            info: result["userInfo"]
          });
        }
      });
  });
};

exports.getUserInfoForDescription = function (username, res, req) {
  const deferred = Q.defer();
  MongoClient.connect(mongodbUrlConfig, function (err, db) {
    const collection = db.collection(collectionNameConfig);

    //check if username is already assigned in our database
    collection.findOne({"userInfo.username" : username})
      .then(function (result) {
        if (null != result) {
          deferred.resolve(result["userInfo"]);
        }
      });
  });
  return deferred.promise;
};

exports.getAwsAutoScaleInfo = function(username, context) {
  const deferred = Q.defer();
  let deployInfo = {};
  MongoClient.connect(mongodbUrlConfig, function (err, db) {
    const collection = db.collection(collectionNameConfig);

    //check if username is already assigned in our database
    collection.findOne({"userInfo.username" : username})
      .then(function (result) {
        if (null != result)
        {
          deployInfo = result["awsKubeAutoScale"];
          deferred.resolve(deployInfo); // username exists
        }
        else
        {
          deferred.resolve(deployInfo); // username not exists
        }
      });
  });
  return deferred.promise;
};

// Returns a compact version of all auto scaling groups starting with "autoScalingPrefix"
// Cluster Name; Launch Configuration Name; Instance Count; Creation Time
exports.describeAutoscalingGroupsCompact = function(awsData, req, res, autoScalingPrefix) {
  const autoScaling = new AWS.AutoScaling({accessKeyId: awsData.accessKeyId,secretAccessKey: awsData.secretAccessKey,region: awsData.region, apiVersion: '2016-11-15'});
  const deferred = Q.defer();
  const params = {
    AutoScalingGroupNames: []
  };

  let titlesArr = [];
  titlesArr.push({"title": "Cluster Name"});
  titlesArr.push({"title": "Launch Configuration"});
  titlesArr.push({"title": "Instance Count"});
  titlesArr.push({"title": "Creation Time"});

  let awsArr = [];
  if(autoScaling) {
    autoScaling.describeAutoScalingGroups(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        const dataAll = [
          {
            "columns": titlesArr,
            "data": awsArr
          }];
        deferred.resolve(dataAll);
      }
      else
      {
        const autoScalingGroupsArr = data.AutoScalingGroups;
        autoScalingGroupsArr.forEach(function (autoScalingGroup) {
          if (autoScalingGroup["AutoScalingGroupName"].startsWith(autoScalingPrefix))
          {
            let row = [];
            row.push(autoScalingGroup["AutoScalingGroupName"]);
            row.push(autoScalingGroup["LaunchConfigurationName"]);
            row.push(autoScalingGroup["Instances"].length);
            row.push(autoScalingGroup["CreatedTime"]);
            awsArr.push(row);
          }
        });
        const dataAll = [{
          "columns": titlesArr,
          "data": awsArr
        }];
        deferred.resolve(dataAll);
      }
    });// successful response
  }
  else {
    const dataAll = [{
      "columns": titlesArr,
      "data": awsArr
    }];
    deferred.resolve(dataAll);
  }
  return deferred.promise;
};

// Returns a full version of all auto scaling groups starting with "autoScalingPrefix"
// Name; LaunchConfigurationName; MinSize; MaxSize; DesiredCapacity; Instances; CreatedTime
exports.describeAutoscalingGroupsFull = function(awsData, req, res, autoScalingPrefix) {
  const autoScaling = new AWS.AutoScaling({accessKeyId: awsData.accessKeyId,secretAccessKey: awsData.secretAccessKey,region: awsData.region, apiVersion: '2016-11-15'});
  const deferred = Q.defer();
  const params = {
    AutoScalingGroupNames: []
  };

  let titlesArr = [];
  titlesArr.push({"title": "Cluster Name"});
  titlesArr.push({"title": "Launch Configuration"});
  titlesArr.push({"title": "Min Size"});
  titlesArr.push({"title": "Max Size"});
  titlesArr.push({"title": "Desired Capacity"});
  titlesArr.push({"title": "Instance Cound"});
  titlesArr.push({"title": "Creation Time"});

  let awsArr = [];
  if(autoScaling) {
    autoScaling.describeAutoScalingGroups(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        const dataAll = [
          {
            "columns": titlesArr,
            "data": awsArr
          }];
        deferred.resolve(dataAll);
      }
      else
      {
        const autoScalingGroupsArr = data.AutoScalingGroups;
        autoScalingGroupsArr.forEach(function (autoScalingGroup) {
          if (autoScalingGroup["AutoScalingGroupName"].startsWith(autoScalingPrefix))
          {
            let row = [];
            row.push(autoScalingGroup["AutoScalingGroupName"]);
            row.push(autoScalingGroup["LaunchConfigurationName"]);
            row.push(autoScalingGroup["MinSize"]);
            row.push(autoScalingGroup["MaxSize"]);
            row.push(autoScalingGroup["DesiredCapacity"]);
            row.push(autoScalingGroup["Instances"].length);
            row.push(autoScalingGroup["CreatedTime"]);
            awsArr.push(row);
          }
        });
        const dataAll = [{
          "columns": titlesArr,
          "data": awsArr
        }];
        deferred.resolve(dataAll);
      }
    });// successful response
  }
  else {
    const dataAll = [{
      "columns": titlesArr,
      "data": awsArr
    }];
    deferred.resolve(dataAll);
  }
  return deferred.promise;
};

exports.getServiceURL = function(username, context) {
  const deferred = Q.defer();

  MongoClient.connect(mongodbUrlConfig, function (err, db) {
    const collection = db.collection(collectionNameConfig);

    //check if username is already assigned in our database
    collection.findOne({"userInfo.username" : username})
      .then(function (result) {
        if (null != result)
        {
          let url;
          if (context === "awsKubernetes")
          {
            url = result[context]["kubernetesConfig"].master.serviceURL;
          }
          else if (context === "awsKubeAutoScale")
          {
            url= result[context]["ipConfig"]["LoadBalIp"];
          }
          else
          {
            url = result[context]["awsAutoscaleConfig"]["loadbaldns"];
          }
          deferred.resolve(url); // username exists
        }
        else
        {
          deferred.resolve(false); // username not exists
        }
      });
  });
  return deferred.promise;
};

exports.describeInstances = function(awsData, req, res) {
  const ec2 = new AWS.EC2({ accessKeyId: awsData.accessKeyId,
                            secretAccessKey: awsData.secretAccessKey,
                            region: awsData.region,
                            apiVersion: "2016-11-15"});
  const deferred = Q.defer();
  const params = {
    DryRun: false
  };
  let titlesArr = [];
  let awsArr = [];

  titlesArr.push({"title": "Name"});
  titlesArr.push({"title": "InstanceID"});
  titlesArr.push({"title": "ImageID"});
  titlesArr.push({"title": "Public IP"});
  titlesArr.push({"title": "Launch Time"});
  titlesArr.push({"title": "State"});

  if(ec2) {
    ec2.describeInstances(params, function (err, data) {
      if (err) {
        const dataAll = [
          {
            "columns": titlesArr,
            "data": awsArr
          }];
        deferred.resolve(err);
      }
      else {
        const instancesArr = data.Reservations;
        instancesArr.forEach(function (instance) {
          let row = [];
          if (instance["Instances"][0]["Tags"][0]) {
            row.push(instance["Instances"][0]["Tags"][0]["Value"]);
          }
          else {
            row.push("None");
          }
          row.push(instance["Instances"][0]["InstanceID"]);
          row.push(instance["Instances"][0]["ImageID"]);
          row.push(instance["Instances"][0]["Public IP"]);
          row.push(instance["Instances"][0]["Launch Time"]);
          row.push(instance["Instances"][0]["State"]["Name"]);
          awsArr.push(row);
        });
        const dataAll = [{
          "columns": titlesArr,
          "data": awsArr
        }];
        deferred.resolve(dataAll);
      }
    });
  }
  else {
    const dataAll = [{
      "columns": titlesArr,
      "data": awsArr
    }];
    deferred.resolve(dataAll);
  }
  return deferred.promise;
};

exports.getLatencyData = function(username) {
  const deferred = Q.defer();
  let latencyArray = {};
  MongoClient.connect("mongodb://" + config.mongodb.host + ":" + config.mongodb.port + "/dbPerfData", function (err, db) {
    const collection = db.collection("usersPerfData");

    //check if username is already assigned in our database
    collection.findOne({"username": username}, {"LatencyDatapoints" : []})
      .then(function (result) {
        if (null != result)
        {
          latencyArray = result["LatencyDatapoints"];
          deferred.resolve(latencyArray); // username exists
        }
        else
        {
          deferred.resolve(latencyArray); // username not exists
        }
      });
  });
  return deferred.promise;
};

exports.getResponseTimeData = function(username) {
  const deferred = Q.defer();
  let responseTimeArray = {};
  MongoClient.connect("mongodb://" + config.mongodb.host + ":" + config.mongodb.port + "/dbPerfData", function (err, db) {
    const collection = db.collection("usersPerfData");

    //check if username is already assigned in our database
    collection.findOne({"username": username}, {"ResponseTimeDatapoints": []})
      .then(function (result) {
        if (null != result)
        {
          responseTimeArray = result["ResponseTimeDatapoints"];
          deferred.resolve(responseTimeArray); // username exists
        }
        else
        {
          deferred.resolve(responseTimeArray); // username not exists
        }
      });
  });
  return deferred.promise;
};

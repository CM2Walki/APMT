const express                                 = require("express");
const router                                  = express.Router();
const funct                                   = require("../functions");
const awsAutoscaleKubernetes                  = require("../auto_scaling_solutions/aws_kubernetes_autoscale/index");
const awsAutoscaleKubernetesMongoFunctions    = require("../auto_scaling_solutions/aws_kubernetes_autoscale/awsAutoscaleKubernetesMongoFunctions");
const request                                 = require("request");
const awsGeneral                              = require("../functions/awsgeneral");

const routeContext = "awsKubeAutoScale";

//===============ROUTES=================
//displays our homepage
router.get("/", function(req, res){
  res.render("awsKubernetesAutoscale/home",{layout: "../awsKubernetesAutoscale/layouts/main",user: req.user} );
});
router.get("/edituserInfo", function(req, res){
  funct.getUserInfoForEdit(req.user.username, res, req);
});
router.get("/getUserInfoForDeploy", function(req, res){
  awsGeneral.getUserInfoForDeploy(req.user.username, res, req, routeContext);
});

router.get("/describeEc2Instances", function(req, res) {
  awsGeneral.getUserInfoForDescription(req.user.username, res, req)
    .then(function (data) {
      if (data) {
        const awsData = {
          "accessKeyId": data.awstoken,
          "secretAccessKey": data.awssecret,
          "region": data.awsregion,
          "s3BucketName": data.s3bucketname,
          "awsKeyName": data.awskeyname
        };
        awsGeneral.describeInstances(awsData, req, res)
          .then(function (data) {
            if (data) {
              res.send(data);
            }
          });
      }
      else {
        res.send("fail")
      }
    });
});
router.get("/describeAwsAutoscaleGroups", function(req, res) {
  awsGeneral.getUserInfoForDescription(req.user.username, res, req)
    .then(function (data) {
      if (data) {
        var awsdata = {
          "accessKeyId": data.awstoken,
          "secretAccessKey": data.awssecret,
          "region": data.awsregion,
          "s3BucketName": data.s3bucketname,
          "awsKeyName": data.awskeyname
        };
        var b = awsAutoscaleKubernetes.describeAutoscalingGroups(awsdata, req, res)
          .then(function (data) {
            if (data) {
              res.send(data);
            }
          });
      }
      else {
        res.send("fail")
      }
    });
});
router.get("/describeAwsLoadBalancer", function(req, res) {
  awsGeneral.getUserInfoForDescription(req.user.username, res, req)
    .then(function (data) {
      if (data) {
        var awsdata = {
          "accessKeyId": data.awstoken,
          "secretAccessKey": data.awssecret,
          "region": data.awsregion,
          "s3BucketName": data.s3bucketname,
          "awsKeyName": data.awskeyname
        };
        var b = awsAutoscaleKubernetes.describeLoadBalancer(awsdata, req, res)
          .then(function (data) {
            if (data) {
              res.send(data);
            }
          });
      }
      else {
        res.send("fail")
      }
    });
});
router.post("/deployawsautoscale", function(req, res){
  var data = req.body;

  var appUrl =  data.giturl;
  var splitArr = appUrl.split("/");
  var appNameTemp = splitArr[splitArr.length -1];
  var appNametemparr = appNameTemp.split(".");
  var appName = appNametemparr[0];

  var awsDeployData =
    {
      "image": data.imageid,
      "launchConfig": {
        "name": "awslaunchconfig",
        "typeInst": data.typeInst
      },
      "targetGroupConfig": {
        "name": "awstargetgroup",
        "vpcId": ""
      },
      "autoScale": {
        "name": "awsAutoscale",
        "maxInst": data.maxInst,
        "minInst": data.minInst,
        "subnet": ""+data.awssubnetid,
        "upPolicy": {
          "name": "awsautoscaleUpPolicy",
          "adjustmentType": data.adjustmentType,
          "metricAggregationType": data.metricAggregationType,
          "policyType": data.policyType,
          "scalingAdjustment": data.scalingAdjustmentUp,
          "alarm": {
            "name": "awsautoscaleUpPolicyAlarm_increase",
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "metricName": data.metricName,
            "threshold": data.threshold,
            "description": "Scaling Up if increase above threshold",
            "Statistic":  "Average",
            "Unit": "Percent"
          }
        },
        "downPolicy": {
          "name": "awsautoscaledownPolicy",
          "adjustmentType": data.adjustmentType,
          "metricAggregationType": data.metricAggregationType,
          "policyType": data.policyType,
          "scalingAdjustment": "-" + data.scalingAdjustmentDown,
          "alarm": {
            "name": "awsautoscaleDownPolicyAlarm_Decrease",
            "ComparisonOperator": "LessThanOrEqualToThreshold",
            "metricName": data.metricName,
            "threshold": data.threshold,
            "description": "Scaling down below the threshhold",
            "Statistic":  "Average",
            "Unit": "Percent"
          }
        }
      },
      "loadBal":{
        "name": "awsloadbal",
        "subnetsArr":[ ""+data.awssubnetid,""+data.awssubnetid2
          /* more items */
          ],
      },
      "application":{
        "giturl": data.giturl,
        "port": data.appPort,
        "name": appName
      }
    };

  var awsdata = {
    "accessKeyId": data.awstoken,
    "secretAccessKey": data.awssecret,
    "region": data.awsregion,
    "s3BucketName": data.s3bucketname,
    "awsKeyName": data.awskeyname,
    "securityId": [data.awssecurityid]
  };
  var kubedata = {
      "master": {
        "image": data.imageid,
        "name": "MasterNode",
      },
      "minion": {
        "image": data.imageid,
        "name": "MinionNode",
      },
      "scalingParams": {
        //"policy": data.scalingParam,
        "cpuPercent": data.podCpuPercent,
        "numMinPods": data.numMinPods,
        "numMaxPods": data.numMaxPods
      },
      "application": {
        "dockerId": "",
        "type": "",
        "name": "movie"
      }
  };

  awsAutoscaleKubernetes.deployAutoscaler(req.user.username,awsDeployData,kubedata, awsdata,req, res);
});
router.get("/terminate", function(req, res) {
  awsGeneral.getUserInfoForDescription(req.user.username, res, req)
    .then(function (data) {
      if (data) {
        var awsdata = {
          "accessKeyId": data.awstoken,
          "secretAccessKey": data.awssecret,
          "region": data.awsregion,
          "s3BucketName": data.s3bucketname,
          "awsKeyName": data.awskeyname
        };
        var b = awsAutoscaleKubernetes.terminateAutoScale(awsdata, req.user.username, req, res);
      }
      else {
        res.send("fail")
      }
    });
});

router.get("/getPodsList", function(req, res) {

  awsAutoscaleKubernetesMongoFunctions.getMasterIp(req.user.username)
    .then(function (ip) {
      if (ip) {
        var url= "http://"+ip+":8001/api/v1/pods";
        console.log(url);
        request({
          url: url,
          method: "GET",
          json: true,
          headers: {
            "content-type": "application/json",
          }
        }, function(error, response, body) {
          if (!error && response.statusCode === 200) {
            var dataToSend = awsAutoscaleKubernetes.loadPodTableList( ["name", "namespace", "creationTimestamp"], "nodeName", "phase", "conditions",  body.items);
            res.send(dataToSend);
          }
        });
      }
      else {
        console.log("ip not found");
        var dataToSend = awsAutoscaleKubernetes.loadPodTableList( ["name", "namespace", "creationTimestamp"], "nodeName", "phase", "conditions",  body.items);
        res.send(dataToSend);
      }
    });
});

router.get("/getAutoScalingList", function(req, res) {
  awsAutoscaleKubernetesMongoFunctions.getMasterIp(req.user.username)
    .then(function (ip) {
      if (ip) {
        var url= "http://"+ip+":8001/apis/autoscaling/v1/horizontalpodautoscalers/"
        request({
          url: url,
          method: "GET",
          json: true,
          headers: {
            "content-type": "application/json",
          }
        }, function(error, response, body) {
          if (!error && response.statusCode === 200) {
            var dataToSend = awsAutoscaleKubernetes.loadHpaList(["name","namespace", "creationTimestamp"], body.items);
            res.send(dataToSend);
          }
        });
      }
      else {
        console.log("ip not found");
        var dataToSend = awsAutoscaleKubernetes.loadHpaList(["name","namespace", "creationTimestamp"], body.items);
        res.send(dataToSend);
      }
    });
});
router.get("/getServicesList", function(req, res) {
  awsAutoscaleKubernetesMongoFunctions.getMasterIp(req.user.username)
    .then(function (ip) {
      if (ip) {
        var url= "http://"+ip+":8001/api/v1/services/";
        console.log(url);
        request({
          url: url,
          method: "GET",
          json: true,
          headers: {
            "content-type": "application/json",
          }
        }, function(error, response, body) {
          if (!error && response.statusCode === 200) {
            var dataToSend = awsAutoscaleKubernetes.loadTableServices( ["name", "namespace", "creationTimestamp"], body.items);
            res.send(dataToSend);
          }
        });
      }
      else {
        console.log("ip not found");
        var dataToSend = awsAutoscaleKubernetes.loadTableServices( ["name", "namespace", "creationTimestamp"], body.items);
        res.send(dataToSend);
      }
    });
});
router.get("/getReplicationControllers", function(req, res) {
  awsAutoscaleKubernetesMongoFunctions.getMasterIp(req.user.username)
    .then(function (ip) {
      if (ip) {
        var url= "http://"+ip+":8001/api/v1/replicationcontrollers/";
        console.log(url);
        request({
          url: url,
          method: "GET",
          json: true,
          headers: {
            "content-type": "application/json",
          }
        }, function(error, response, body) {
          if (!error && response.statusCode === 200) {
            var dataToSend = awsAutoscaleKubernetes.loadReplicationControllerList( ["name", "namespace", "creationTimestamp"], body.items);
            res.send(dataToSend);
          }
        });
      }
      else {
        console.log("ip not found");
        var dataToSend = awsAutoscaleKubernetes.loadReplicationControllerList( ["name", "namespace", "creationTimestamp"], body.items);
        res.send(dataToSend);
      }
    });
});
router.get("/getNodesData", function(req, res) {
  awsAutoscaleKubernetesMongoFunctions.getMasterIp(req.user.username)
    .then(function (ip) {
      if (ip) {
        var url= "http://"+ip+":8001/api/v1/nodes/";
        console.log(url);
        request({
          url: url,
          method: "GET",
          json: true,
          headers: {
            "content-type": "application/json",
          }
        }, function(error, response, body) {
          if (!error && response.statusCode === 200) {
            var dataToSend = awsAutoscaleKubernetes.loadNodeList(["name", "creationTimestamp"], body.items);
            res.send(dataToSend);
          }
        });
      }
      else {
        console.log("ip not found");
        var dataToSend = awsAutoscaleKubernetes.loadNodeList(["name", "creationTimestamp"], body.items);
        res.send(dataToSend);
      }
    });
});

router.post("/getautoScaleData", function(req,res){
  formElements = req.body;
  var loadTestName = formElements.testName;
  var timestamp = [];
  var desiredInstances = [];
  var currentInstances = [];
  var cpuPercentageAvg = [];
  var k= 0;
  awsAutoscaleKubernetesMongoFunctions.getAutoscaleData(req.user.username,loadTestName)
    .then(function (dataArr) {
      try{
        console.log(dataArr.length);
        if (dataArr.length) {
          k = dataArr.length;
          for (i = 0; i < dataArr.length; i++) {
            timestamp.push(dataArr[i].time);
            desiredInstances.push(dataArr[i].data.DesiredCapacity);
            currentInstances.push(dataArr[i].data.Instances);
            cpuPercentageAvg.push(dataArr[i].cpuUtilization.Datapoints[0].Average);
          }
          var allData = {
            "timestamp": timestamp,
            "desiredInstances": desiredInstances,
            "currentInstances": currentInstances,
            "cpuPercentage": cpuPercentageAvg
          };
          res.send(allData);
        }

        else {
          var allData = {
            "timestamp" : "",
            "desiredInstances" : "",
            "currentInstances" : "",
            "cpuPercentage" : ""
          };
          res.send(allData);
        }
      }catch(err) {
        console.log(err);
      }
    });
});

router.get("/edituserInfo", function(req, res){
  funct.getUserInfoForEdit(req.user.username, res, req);
});

router.get("/getCurrentData", function(req,res){
  awsGeneral.getUserInfoForDescription(req.user.username, res, req)
    .then(function (data) {
      if (data) {
        var awsdata = {
          "accessKeyId": data.awstoken,
          "secretAccessKey": data.awssecret,
          "region": data.awsregion,
          "s3BucketName": data.s3bucketname,
          "awsKeyName": data.awskeyname
        };
        awsAutoscaleKubernetes.getCurrentData(awsdata, req.user.username, req, res);
      }
      else {
        console.log("fail");
        res.send("fail")
      }
    });
});

router.use(function(req, res, next){
  // the status option, or res.statusCode = 404
  // are equivalent, however with the option we
  // get the "status" local available as well
  //res.render("404",{user: req.user});
});
router.use(function(err, req, res, next){
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  //res.render("500",{user: req.user});
});
//logs user out of site, deleting them from the session, and returns to homepage

module.exports = router;

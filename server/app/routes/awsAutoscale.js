const express                       = require("express");
const router                        = express.Router();
const awsAutoscale                  = require("../auto_scaling_solutions/aws_autoscale/index");
const awsAutoScaleMongoFunctions    = require("../auto_scaling_solutions/aws_autoscale/awsAutoscaleMongoFunctions");
const awsGeneral                    = require("../functions/awsgeneral");

const routeContext = "awsAutoScale";

//===============ROUTES=================
//displays our homepage
router.get("/", function(req, res){
  res.render("awsAutoscale/home", {layout: "../awsAutoscale/layouts/main", user: req.user} );
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
        const awsData = {
          "accessKeyId": data.awstoken,
          "secretAccessKey": data.awssecret,
          "region": data.awsregion,
          "s3BucketName": data.s3bucketname,
          "awsKeyName": data.awskeyname
        };
        awsAutoscale.describeAutoscalingGroups(awsData, req, res)
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
        const awsData = {
          "accessKeyId": data.awstoken,
          "secretAccessKey": data.awssecret,
          "region": data.awsregion,
          "s3BucketName": data.s3bucketname,
          "awsKeyName": data.awskeyname
        };
        awsAutoscale.describeLoadBalancer(awsData, req, res)
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

router.post("/deployawsautoscale", function(req, res) {
  const data = req.body;
  const appUrl =  data.giturl;
  const splitArr = appUrl.split("/");
  const appNameTemp = splitArr[splitArr.length -1];
  const appNametemparr = appNameTemp.split(".");
  const appName = appNametemparr[0];

  const awsDeployData =
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
        "subnet": "" + data.awssubnetid,
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
        "subnetsArr":[ ""+ data.awssubnetid,"" + data.awssubnetid2
          ],
      },
      "application":{
        "giturl": data.giturl,
        "port": data.appPort,
        "name": appName
      }
    };

  const awsData = {
    "accessKeyId": data.awstoken,
    "secretAccessKey": data.awssecret,
    "region": data.awsregion,
    "s3BucketName": data.s3bucketname,
    "awsKeyName": data.awskeyname,
    "securityId": [data.awssecurityid]
  };

  awsAutoscale.deployAutoscaler(req.user.username, awsDeployData, awsData, req, res);
});

router.get("/terminate", function(req, res) {
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
        awsAutoscale.terminateAutoScale(awsData, req.user.username, req, res);
      }
      else {
        res.send("fail")
      }
    });
});

router.get("/getCurrentData", function(req, res){
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
        awsAutoscale.getCurrentData(awsData, req.user.username, req, res);
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
  res.render("404", {user: req.user});
});

router.use(function(err, req, res, next){
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  res.render("500", {user: req.user});
});
//logs user out of site, deleting them from the session, and returns to homepage

module.exports = router;

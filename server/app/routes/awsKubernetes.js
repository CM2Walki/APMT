const express               = require("express");
const router                = express.Router();
const funct                 = require("../functions");
const kube                  = require("../auto_scaling_solutions/aws_kubernetes/index");
const kubeMongoFunctions    = require("../auto_scaling_solutions/aws_kubernetes/kubeMongoFunctions");
const request               = require("request");
const awsGeneral            = require("../functions/awsgeneral");

const routeContext = "awsKubernetes";

//===============ROUTES=================
//displays our homepage
router.get("/", function(req, res){
  res.render("awsKubernetes/home",{layout: "../awsKubernetes/layouts/main",user: req.user} );
});

router.get("/edituserInfo", function(req, res){
  funct.getUserInfoForEdit(req.user.username, res, req);
});

router.get("/deploykubernetesAws", function(req, res){
  awsGeneral.getUserInfoForDeploy(req.user.username, res, req, routeContext);
});


router.get("/getPodsList", function(req, res) {
  kubeMongoFunctions.getMasterIp(req.user.username)
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
            var dataToSend = kube.loadPodTableList( ["name", "namespace", "creationTimestamp"], "nodeName", "phase", "conditions",  body.items);
            res.send(dataToSend);
          }
        });
      }
      else {
        console.log("ip not found");
        var dataToSend = kube.loadPodTableList( ["name", "namespace", "creationTimestamp"], "nodeName", "phase", "conditions",  body.items);
        res.send(dataToSend);
      }
    });
});

router.get("/getAutoScalingList", function(req, res) {
  kubeMongoFunctions.getMasterIp(req.user.username)
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
            var dataToSend = kube.loadHpaList(["name","namespace", "creationTimestamp"], body.items);
            res.send(dataToSend);
          }
        });
      }
      else {
        console.log("ip not found");
        var dataToSend = kube.loadHpaList(["name","namespace", "creationTimestamp"], body.items);
        res.send(dataToSend);
      }
    });
});

router.get("/getServicesList", function(req, res) {
  kubeMongoFunctions.getMasterIp(req.user.username)
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
            var dataToSend = kube.loadTableServices( ["name", "namespace", "creationTimestamp"], body.items);
            res.send(dataToSend);
          }
        });
      }
      else {
        console.log("ip not found");
        var dataToSend = kube.loadTableServices( ["name", "namespace", "creationTimestamp"], body.items);
        res.send(dataToSend);
      }
    });
});

router.get("/getReplicationControllers", function(req, res) {
  kubeMongoFunctions.getMasterIp(req.user.username)
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
            var dataToSend = kube.loadReplicationControllerList( ["name", "namespace", "creationTimestamp"], body.items);
            res.send(dataToSend);
          }
        });
      }
      else {
        console.log("ip not found");
        var dataToSend = kube.loadReplicationControllerList( ["name", "namespace", "creationTimestamp"], body.items);
        res.send(dataToSend);
      }
    });
});

router.get("/getNodesData", function(req, res) {
  kubeMongoFunctions.getMasterIp(req.user.username)
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
            var dataToSend = kube.loadNodeList(["name", "creationTimestamp"], body.items);
            res.send(dataToSend);
          }
        });
      }
      else {
        console.log("ip not found");
        var dataToSend = kube.loadNodeList(["name", "creationTimestamp"], body.items);
        res.send(dataToSend);
      }
    });
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
            else
            {
              res.send("fail");
            }
          }).catch(err => res.send(err.toString()));
      }
      else {
        res.send("fail");
      }
    });
});

router.get("/terminateEc2Instances", function(req, res) {
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
        var b = kube.terminateInstances(awsdata, req.user.username, req, res);
      }
      else {
        res.send("fail")
      }
    });
});

router.post("/deploykubernetesaws", function(req, res){
  var data = req.body;

  var kubedata =
    {
      "master": {
        "image": data.imageid,
        "name": "MasterNode",
        "numInst": data.numInstMaster,
        "typeInst": data.typeInstMaster
      },
      "minion": {
        "image": data.imageid,
        "name": "MinionNode",
        "numInst": data.numInstMinion,
        "typeInst": data.typeInstMinion
      },
      "scalingParams": {
        "policy": data.scalingParam,
        "cpuPercent": data.cpuPercent,
        "numMinPods": data.numMinPods,
        "numMaxPods": data.numMaxPods
      },
      "application":{
        "dockerId": "",
        "type":"",
        "name": "movie"
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

  kube.deployOnAws(req.user.username,kubedata, awsdata,req, res);
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



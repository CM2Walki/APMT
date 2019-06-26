const bcrypt          = require('bcryptjs');
const Q               = require('q');
const config          = require('../../config');

// MongoDB connection information
const mongodbUrl = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.dbUsersData.name;
const collectionName = config.mongodb.dbUsersData.collectionName;
const MongoClient = require('mongodb').MongoClient;

exports.localReg = function (username, password) {
  const deferred = Q.defer();

  MongoClient.connect(mongodbUrl, function (err, db) {
    let collection = db.collection(collectionName);
    //check if username is already assigned in our database
    collection.findOne({'userInfo.username' : username})
      .then(function (result) {
        if (null != result) {
          console.log("USERNAME ALREADY EXISTS:", result.username);
          deferred.resolve(false); // username exists
        }
        else {
          const hash = bcrypt.hashSync(password, 8);
          const user = {
            "userInfo": {
              "username": username,
              "password": hash,
              "awssetup": false,
              "gcesetup": false,
              "azuresetup": false,
              "avatar": "http://placepuppy.it/images/homepage/Beagle_puppy_6_weeks.JPG"
            }
          };
          console.log("CREATING USER:", username);
          collection.insert(user)
            .then(function () {
              db.close();
              deferred.resolve(user["userInfo"]);
            });
        }
      });
  });
  return deferred.promise;
};

exports.localAuth = function (username, password) {
  const deferred = Q.defer();

  MongoClient.connect(mongodbUrl, function (err, db) {
    const collection = db.collection(collectionName);

    collection.findOne({'userInfo.username' : username})
      .then(function (result) {
        if (null == result) {
          console.log("USERNAME NOT FOUND:", username);
          deferred.resolve(false);
        }
        else {
          const hash = result["userInfo"].password;
          console.log("FOUND USER: " + result["userInfo"].username);
          if (bcrypt.compareSync(password, hash)) {
            deferred.resolve(result["userInfo"]);
          } else {
            console.log("AUTHENTICATION FAILED");
            deferred.resolve(false);
          }
        }
        db.close();
      });
  });
  return deferred.promise;
};

exports.getUserInfo = function (user, res, req) {
  MongoClient.connect(mongodbUrl, function (err, db) {
    const collection = db.collection(collectionName);

    //check if username is already assigned in our database
    collection.findOne({'userInfo.username' : user.username})
      .then(function (result) {
        if (null != result) {
          res.render('user', {
              user: user,
              info: result["userInfo"]
            });
        }
        else
        {
          console.log("UserInfo not found");
        }
      });
  });
};

exports.getUserInfoforEdit = function (user, res, req) {
  MongoClient.connect(mongodbUrl, function (err, db) {
    const collection = db.collection(collectionName);
    //check if username is already assigned in our database
    collection.findOne({'userInfo.username' : user.username})
      .then(function (result) {
        if (null != result) {
          console.log("found");
          res.render('editUser', {
            user: user,
            info: result["userInfo"]
          });
        }
        else
        {
          console.log("not found");
        }
      });
  });
};

exports.saveUserInfo = function (user, data, responseExData) {
  const deferred = Q.defer();

  MongoClient.connect(mongodbUrl, function (err, db) {
    let collection = db.collection(collectionName);
    //check if username is already assigned in our database
    collection.findOne({'userInfo.username' : user.username})
      .then(function (result) {
        if (null != result)
        {
          collection.update({'userInfo.username' : user.username},
            {$set : {
              "userInfo.name": data.name,
              "userInfo.awstoken": data.awstoken,
              "userInfo.awssecret": data.awssecret,
              "userInfo.awskeyname": data.awskeyname,
              "userInfo.awsregion": data.awsregion,
              "userInfo.awssecurityid": data.awssecurityid,
              "userInfo.awssubnetid": data.awssubnetid,
              "userInfo.awssubnetid2": data.awssubnetid2
            }
            },
            {upsert: false});
          let counter = 0;
          console.log(result.awstoken);

          result.forEach(function(value) {
            console.log(value.awstoken);
          });
          deferred.resolve(true); // username exists
        }
        else
        {
          console.log("user Not exists:", user.username);
          deferred.resolve(false); // username not exists
        }
      });
  });
  return deferred.promise;
};

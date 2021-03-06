const path                          = require("path");
const express                       = require("express");
const exphbs                        = require("express-handlebars");
const passport                      = require("passport");
const LocalStrategy                 = require("passport-local");
const bodyParser                    = require("body-parser");
const app                           = express();
const session                       = require("express-session");
const funct                         = require("./functions");
const routes                        = require("./routes/general");
const kubernetesRoutes              = require("./routes/awsKubernetes");
const awsAutoscaleRoutes            = require("./routes/awsAutoscale");
const awsAutoscaleKubernetesRoutes  = require("./routes/awsKubernetesAutoscale");
const loadtestK6Routes              = require("./routes/loadtestK6");

//===============PASSPORT=================

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the LocalStrategy within Passport to login users.
passport.use("local-signin", new LocalStrategy(
  { passReqToCallback : true }, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.localAuth(username, password)
    .then(function (user) {
      if (user) {
        req.session.success = "You are successfully logged in using " + user.username + "!";
        done(null, user);
      }
      if (!user) {
        req.session.error = "Login failed. E-Mail or Password invalid."; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));

// Use the LocalStrategy within Passport to Register/"signup" users.
passport.use("local-signup", new LocalStrategy(
  { passReqToCallback : true }, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.localReg(username, password)
    .then(function (user) {
      if (user) {
        req.session.success = "You are successfully registered and logged in " + user.username + "!";
        done(null, user);
      }
      if (!user) {
        req.session.error = "That E-Mail is already in use, please try a different one."; //inform user could not log them in
        done(null, user);
      }
    });
  }
));

//===============EXPRESS=================

// Configure Express
app.use(session({
  secret: "you do not know me",
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 90000000 }
}));

app.use(passport.initialize());

app.use(passport.session());

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

// Session-persisted message middleware
app.use("/",function(req, res, next) {
  const err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});

// Configure express to use handlebars templates
const hbs = exphbs.create({
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname),
    helpers: {
      toJSON: function (object) {
        return JSON.stringify(object, null,"\t");
      },
      toJSONusername: function (object) {
        return object.username;
      },
      toJSONname: function (object) {
        return object.name;
      },
      toJSONemail: function (object) {
        return object.email;
      },
      toJSONawstoken: function (object) {
        return object.awstoken;
      },
      toJSONawssecret: function (object) {
        return object.awssecret;
      },
      toJSONawstokensecret: function (object) {
        return object.awstoken.replace(/./g, "*");
      },
      toJSONawssecretsecret: function (object) {
        return object.awssecret.replace(/./g, "*");
      },
      toJSONawskeyname: function (object) {
        return object.awskeyname;
      },
      toJSONawsregion: function (object) {
        return object.awsregion;
      },
      toJSONawssubnetid: function (object) {
        return object.awssubnetid;
      },
      toJSONawssubnetid2: function (object) {
        return object.awssubnetid2;
      },
      toJSONawssecurityid: function (object) {
        return object.awssecurityid;
      },
    }
});

app.engine("handlebars", hbs.engine);

app.set("view engine", "handlebars");

app.set("views", path.join(__dirname, "views/"));

app.use(express.static(path.join(__dirname, "public")));

app.use("/awsKubernetesAutoscale", awsAutoscaleKubernetesRoutes);

app.use("/awsKubernetes", kubernetesRoutes);

app.use("/awsAutoscale", awsAutoscaleRoutes);

app.use("/loadtestK6", loadtestK6Routes);

app.use("/", routes);

module.exports = app;

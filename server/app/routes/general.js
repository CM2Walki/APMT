const express               = require('express');
const router                = express.Router();
const funct                 = require('../functions');
const passport              = require('passport');

//===============ROUTES=================
//displays our homepage
router.get('/', function(req, res) {
  funct.checkCSPSetup(req.user, req.body, res.body)
    .then(function (user) {
      if (user) {
        res.render('home', {user: req.user});
      }
    });
});

router.get('/edituserInfo', function(req, res) {
  funct.getUserInfoForEdit(req.user, res, req);
});

//displays our signup page
router.get('/signin', function(req, res) {
  res.render('signin');
});

router.get('/register', function(req, res) {
    res.render('register');
});

// logs user out of site, deleting them from the session, and returns to homepage
router.get('/logout', function(req, res, next) {
  const name = req.user.username;
  console.log("LOGGING OUT " + req.user.username);
  req.logout();
  res.redirect('/');
});

// Sends the request through our local register strategy, and if successful takes user to homepage,
// otherwise returns then to register page
router.post('/local-reg', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/register'
  })
);

// Sends the request through our local login/signin strategy, and if successful takes user to homepage,
// otherwise returns then to signin page
router.post('/login', passport.authenticate('local-signin', {
    successRedirect: '/',
    failureRedirect: '/signin'
  })
);

/* GET getUserInfo page. */
router.get('/userinfo', function(req, res) {
  funct.getUserInfo(req.user, res, req);
});

router.post('/saveuserInfo', function(req, res){
  funct.saveUserInfo(req.user, req.body, res.body)
    .then(function (user) {
      if (user) {
        console.log("added information");
        //dataForm:
        res.render('success', {
          user: req.user,
          dataForm: req.body,
          dataClient: req.body
        });
      }
      else {
        console.log("user not found");
        res.render('failure', {
          user: req.user.username,
          error: "Not able to submit, check your data"
        });
      }
    });
});

router.use(function(req, res, next){
  // the status option, or res.statusCode = 404
  // are equivalent, however with the option we
  // get the "status" local available as well
  res.render('404', {user: req.user});
});

router.use(function(err, req, res, next){
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  res.render('500', {user: req.user});
});

module.exports = router;

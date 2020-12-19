'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;
//const mongodb = require('mongodb').MongoClient;
const LocalStrategy = require('passport-local');
//const LocalStrategy = require('passport-local').Strategy;

const app = express();
app.set('view engine', 'pug');

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
mongodb.connect(process.env.MONGO_URI, (err, db) => {
if(err) {
console.log('Database error:' + err);
} else {
console.log('Successful database connection');
//serialization and app.listen
}});
*/
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
  
}));
app.use(passport.initialize());
app.use(passport.session());



myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  // Be sure to change the title
  
  app.route('/').get((req, res) => {
    res.render('pug',
    { title: 'Connected to Database', 
      message: 'Please login',
      showLogin: true} );
    });

  //});
  /*
  app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
  */
  // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
    done(null, doc);
    });
  });


 
  app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }),
    (req,res) => {
               res.redirect('/profile');
  });
          
 
  app.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
  });
  passport.use(new LocalStrategy(
   function(username, password, done) {
    myDataBase.findOne({ username: username }, function (err, user) {
      console.log('User '+ username +' attempted to log in.');
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (password !== user.password) { return done(null, false); }
      return done(null, user);
    });
   }
  )); 


  app
  .route('/profile')
  .get(ensureAuthenticated, (req,res) => {
      res.render(process.cwd() + '/views/pug/profile',{username:req.user.username});
  });
  
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };
  // Be sure to add this...
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
 });


app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + process.env.PORT);
});
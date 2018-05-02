const express = require('express');
const passport = require('passport');
const router = express.Router();
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const request = require('request');
//file containing credentials for auth0
const key = require('../key');

const env = {
  AUTH0_CLIENT_ID: key.AUTH0_CLIENT_ID,
  AUTH0_DOMAIN: key.AUTH0_DOMAIN,
  AUTH0_CLIENT_SECRET: key.AUTH0_CLIENT_SECRET
};

router.get('/', (req, res, next) => {
  // Now, rather than just sending the text "You are on the homepage", we are going to actually render the view we created using the res.render method. The second argument will allow us to pass in data from the backend to our view dynamically.
  res.render('index', { env: env });
});

router.get('/login', passport.authenticate('auth0', {
    clientID: env.AUTH0_CLIENT_ID,
    domain: env.AUTH0_DOMAIN,
    redirectUri: 'http://localhost:3000/callback',
    responseType: 'code',
    scope: 'openid profile email'
  }), (req, res) => {
    res.redirect("/");
  }
);

router.get('/logout', (req, res)=>{
  // For the logout page, we don't need to render a page, we just want the user to be logged out when they hit this page. We'll use the ExpressJS built in logout method, and then we'll redirect the user back to the homepage.
  req.logout();
  res.redirect('/');
});

router.get('/polls', ensureLoggedIn, (req, res)=>{
  // You may have noticed that we included two new require files, one of them being request. Request allows us to easily make HTTP requests. In our instance here, we are using the Huffington Post's API to pull the latest election results, and then we're sending that data to our polls view.
  // The second require was the connect-ensure-loggedin library, and from here we just required a method called ensureLoggedIn, which will check and see if the current user is logged in before rendering the page. If they are not, they will be redirected to the login page. We are doing this in a middleware pattern, we first call the ensureLoggedIn method, wait for the result of that action, and finally execute our /polls controller.
  request('http://elections.huffingtonpost.com/pollster/api/charts.json?topic=2016-president',  (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const polls = JSON.parse(body);
      // For this view, we are not only sending our environmental information, but the polls and user information as well.
      res.render('polls', {env: env, user: req.user, polls: polls});
    } else {
      res.render('error');
    }
  })
});

router.get('/user', ensureLoggedIn, (req, res, next) =>{
  // Same thing for our
  res.render('user', { env: env, user: req.user });
});

router.get('/callback', passport.authenticate('auth0',
  {failureRedirect: '/url-if-something-fails'}), (req, res) => {
  res.redirect(req.session.returnTo || '/polls');
});

module.exports = router;
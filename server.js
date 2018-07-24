const { RTMClient, WebClient } = require('@slack/client');
const teamId = 'sjs-2018';
const token = process.env.BOT_USER_OAUTH_ACCESS_TOKEN;
let axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

// models
const User = require('./models').User;

const scheduleBotChannel = 'DBWNA5TCN';

// google api setup
const {google} = require('googleapis');

const scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar'
];

// new client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.DOMAIN + '/google/callback'
);


let app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const rtm = new RTMClient(process.env.TOKEN);
rtm.start();

rtm.on('message', event=> {
  let message = event.text;
  let channel = event.channel;
  if (channel === scheduleBotChannel){
    let responseMessage = 'sample response from backend';
    rtm.sendMessage(responseMessage, scheduleBotChannel)
    .then(msg =>
      console.log('message sent:' + msg)
    ).catch(err=> console.log("error", err));
  }




})

// GET route that redirects to google oatuh2 url
app.get('/google/calendar', function(req, res) {
    var auth_id = req.query.auth_id;
    // create a new user in database based on auth_id
    var newUser = new User({auth_id});
    newUser.save()
    .then(() => ( 
      // generate a url that asks permissions for Google+ and Google Calendar scopes
      var url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'online',
        // refresh_token only returned on the first authorization

        scope: scopes,
        state: encodeURIComponent(JSON.stringify({
          auth_id: auth_id
        })),
        prompt: 'consent'
      });

      res.redirect(url);
    ))
    .catch((err) => {
      res.send("error", err);
    })

    

})

// GET route that handles oauth callback for google api
app.get('/google/callback', function(req, res) {
    var code = req.query.code;
    // This will provide an object with the access_token and refresh_token
    oauth2Client.getToken(code, (err, tokens) => {
      oauth2Client.setCredentials(tokens);

      // look for user based on auth_id and store token in database
      var auth_id = JSON.parse(decodeURIComponent(req,query.state))
      User.findOne({auth_id})
      .exec()
      .then((user) => {
        // store token
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      })
      .catch((err) => {
        res.send("error", err);
      })

  })

})


const calendar = google.calendar({
  version: 'v3',
  auth: oauth2Client
})

calendar.events.list({
  calendarId: 'primary',
  timeMin:(new Date()).toISOString(),
  maxResults: 10,
  singleEvents: true,
  orderBy: 'startTime'
}, (err, resp) => {
  console.log(resp);
})

calendar.event.insert({
  calendarId: 'primary',
  summary: 'eat fish',
  start: {
    date: new Date(Date.now() + 30000) // 30 seconds from now
  },
  end: {
    date: new Date(Date.now() + 90000)
  }
}, (err, resp) => {
  console.log(resp);
})

app.post('/test', function(req, res){
  console.log('something');
  // res.setStatus(200);
  // res.setContentType('/text/plain');
  // res.getStreamWriter.writeString(req.body.data.challenge);
  // console.log(req);
  res.send(req.body.challenge);
  // res.send(req.body.data.challenge);
})

app.listen(1337);

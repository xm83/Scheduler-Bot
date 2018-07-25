const routingUrl = 'https://localhost:1337'
const { RTMClient, WebClient } = require('@slack/client')
const teamId = 'sjs-2018'
const token = process.env.BOT_USER_OAUTH_ACCESS_TOKEN
let axios = require('axios');
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const dialogflow = require('dialogflow')
<<<<<<< HEAD
const port = 1337;
const BOT_ID = "UBV5QQP6G"
=======
const routingUrl = 'https://2d0f7e15.ngrok.io'
const port = 1337
>>>>>>> 6f9f5d724410b584cf4ceaaa2e4ea0afa7474b2d

// models
const User = require('./models').User

const scheduleBotChannel = 'DBWNA5TCN'

// gCal api setup
const {google} = require('googleapis')
const {scopes, makeCalendarAPICall} = require('./cal')

<<<<<<< HEAD
// TODO: how to create a new unique google profile for every new user???
=======
>>>>>>> 6f9f5d724410b584cf4ceaaa2e4ea0afa7474b2d
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.DOMAIN + '/google/callback'
<<<<<<< HEAD
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// dialogflow session setup
const projectId = process.env.DIALOGFLOW_PROJECT_ID; //https://dialogflow.com/docs/agents#settings
const sessionId = 'quickstart-session-id';
const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

//rtm slack message received
const rtm = new RTMClient(token);
rtm.start();
=======
)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// dialogflow session setup
const projectId = process.env.DIALOGFLOW_PROJECT_ID //https://dialogflow.com/docs/agents#settings
const sessionId = 'quickstart-session-id'
const sessionClient = new dialogflow.SessionsClient()
const sessionPath = sessionClient.sessionPath(projectId, sessionId)
>>>>>>> 6f9f5d724410b584cf4ceaaa2e4ea0afa7474b2d


<<<<<<< HEAD
  let message = event.text;
  const slackId = event.user;
  
  User.findOne({slackId: slackId})
  .then(user=> {
    if (!user || !user.access_token ){
      //send link to user so that they can authenticate
      rtm.sendMessage(routingUrl + '/google/calendar?slackId=' + slackId, event.channel);
      //send this link to the user
    }else{
=======
const rtm = new RTMClient(token)
rtm.start()

rtm.on('message', event => {
  console.log(event)
  const message = event.text
  const slackId = event.user
  User.findOne({slackId: slackId})
    .then(user => {
      if (!user || !user.access_token) {
      // send link to user so that they can authenticate
        rtm.sendMessage(routingUrl + '/google/calendar?slackId=' + slackId, event.channel)
      // send this link to the user
      } else {
>>>>>>> 6f9f5d724410b584cf4ceaaa2e4ea0afa7474b2d
      // dialog flow stuff here

      // user already exists: send query to Api.ai
        const request = {
          session: sessionPath,
          queryInput: {
            text: {
              text: message,
              languageCode: 'en-US'
            }
          }
        }
        sessionClient
          .detectIntent(request)
          .then(responses => {
            console.log('Detected intent')
            const result = responses[0].queryResult
            console.log(`  Query: ${result.queryText}`)
            console.log(`  Response: ${result.fulfillmentText}`)
            rtm.sendMessage(result.fulfillmentText, event.channel)
            if (result.intent) {
              console.log(`  Intent: ${result.intent.displayName}`)
            } else {
              console.log(`  No intent matched.`)
            }
          }).then(msg => console.log('message sent')
          )
      }
    })
})

<<<<<<< HEAD
//webhook post route for dialogflow query responses
app.post('/webhook', function(req, res){
  if (req.body.queryResult.allRequiredParamsPresent){
    res.json(req.body);
=======
// webhook post route for dialogflow query responses
app.post('/webhook', function (req, res) {
  if (req.body.queryResult.allRequiredParamsPresent) {
<<<<<<< HEAD
    res.json(req.body)
>>>>>>> 6f9f5d724410b584cf4ceaaa2e4ea0afa7474b2d
=======
    let parameters = req.body.queryResult.parameters
    let subject = parameters.subject
    let date = parameters.date
    // go back to slack to generate button
    
>>>>>>> master
  }
})

/* GOOGLE API ROUTES */
<<<<<<< HEAD
// GET route that redirects to google oauth2 url
=======
// GET route that redirects to google oatuh2 url
>>>>>>> 6f9f5d724410b584cf4ceaaa2e4ea0afa7474b2d
app.get('/google/calendar', function (req, res) {
  console.log('get google calendar route')
  // TODO: get slackId, task, and action from slack
  let slackId = req.query.slackId || 'myslackId'
  // save action into database?

  // check if user exists
  User.findOne({
    slackId: slackId
  })
    .exec()
    .then((user) => {
      if (!user && user !== BOT_ID) {
      // create a new user in database
        var newUser = new User({
          slackId: slackId
        })
        newUser.save()
          .then((user) => {
            // generate a url that asks permissions for Google+ and Google Calendar scopes
            var url = oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
              access_type: 'online',
              // refresh_token only returned on the first authorization
              scope: scopes,
              state: encodeURIComponent(JSON.stringify({
                auth_id: user._id
              })),
              prompt: 'consent'
            })
            res.redirect(url)
          })
          .catch((err) => {
            console.log('error', err)
            res.status(500).send('internal error')
          })
      } else {
        // check access token
        if (!user.access_token) {
          // user exists but failed to authenticate
          var url = oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
<<<<<<< HEAD
              access_type: 'online',
              // refresh_token only returned on the first authorization
              scope: scopes,
              state: encodeURIComponent(JSON.stringify({
                auth_id: user._id
              })),
              prompt: 'consent'
            })
            console.log('auth url', url);
            res.redirect(url);
=======
            access_type: 'online',
            // refresh_token only returned on the first authorization
            scope: scopes,
            state: encodeURIComponent(JSON.stringify({
              auth_id: user._id
            })),
            prompt: 'consent'
          })
          res.redirect(url)
>>>>>>> 6f9f5d724410b584cf4ceaaa2e4ea0afa7474b2d
        } else {
          // user exists and is authenticated - shouldn't be here
          console.log('why are you here???')
          res.status(500).send('server error')
        }
      }
    })
    .catch((err) => {
      console.log('error finding user', err)
      res.status(500).send('internal server error')
    })
})
    // .catch((err) => {
    //   console.log('error finding user', err)
    //   res.status(500).send('internal server error')
    // })

// GET route that handles oauth callback for google api
app.get('/google/callback', function (req, res) {
  var code = req.query.code
  // This will provide an object with the access_token and refresh_token
  oauth2Client.getToken(code, (err, tokens) => {
    console.log('token!!', tokens)
    if (err) return console.log('!!error:', err)
    oauth2Client.setCredentials(tokens)

    // look for user based on auth_id and store token in database
    var auth_id = JSON.parse(decodeURIComponent(req.query.state)).auth_id
    console.log('auth_id!!!', auth_id)
    User.findById(auth_id)
      .exec()
      .then((user) => {
        if (!user) {
          console.log('user not found')
          res.status(500).send('database error')
        } else {
          user.access_token = tokens.access_token
          user.refresh_token = tokens.refresh_token
          user.save()
<<<<<<< HEAD

          // once you get the token, make API call
          makeCalendarAPICall(tokens);
          res.status(200).send('success')
=======
          res.status(200).send('Successfully authenticated. You may now go back to Slack to send the message again')
>>>>>>> 6f9f5d724410b584cf4ceaaa2e4ea0afa7474b2d
        }
      })
      .catch((err) => {
        console.log('errorrrr', err)
        res.status(500).send('internal error')
      })
    })
  })

<<<<<<< HEAD
app.listen(port || process.env.PORT);
=======
app.listen(port || process.env.PORT)
>>>>>>> 6f9f5d724410b584cf4ceaaa2e4ea0afa7474b2d

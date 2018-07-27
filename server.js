const { RTMClient, WebClient } = require('@slack/client')
// const teamId = 'sjs-2018'
const token = process.env.BOT_USER_OAUTH_ACCESS_TOKEN
let axios = require('axios')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const dialogflow = require('dialogflow')
// const routingUrl = 'http://32563138.ngrok.io'
const slackTeam = 'sjs-2018'
const port = 1337
// const handlesNo = `${process.env.DOMAIN}/noRoute`

const BOT_ID = 'BBYLBEHGV'
// models
const User = require('./models').User
const Meeting = require('./models').Meeting

const web = new WebClient(token)

// gCal api setup
const {google} = require('googleapis')
const {scopes, makeCalendarAPICall} = require('./cal')

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.DOMAIN + '/google/callback'
)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// dialogflow session setup
const projectId = process.env.DIALOGFLOW_PROJECT_ID // https://dialogflow.com/docs/agents#settings
const sessionId = 'quickstart-session-id'
const sessionClient = new dialogflow.SessionsClient()
const sessionPath = sessionClient.sessionPath(projectId, sessionId)

const rtm = new RTMClient(token)
rtm.start()

rtm.on('message', event => {
  const message = event.text
  const slackId = event.user
  console.log(slackId, 'slackid on message')
  if (slackId) {
    User.findOne({slackId: slackId})
      .then(user => {
        console.log('user:', user)
        /** Check that the user has not been authenticated AND we're not responding to a BOT's message **/
        if ((!user || !user.access_token) && !event.bot_id && event.user !== BOT_ID) {
        /* send link to user so that they can authenticate */
          rtm.sendMessage(process.env.DOMAIN + '/google/calendar?slackId=' + slackId, event.channel)

        /* The user is authenticated and it's not a BOT */
        } else if (Object.keys(user.pendingTask).length === 0 && !event.bot_id && event.user !== BOT_ID) {
          console.log('pending:', user.pendingTask)
          rtm.sendMessage('Please approve your pending tasks!', event.channel)
        } else if (!event.bot_id && event.user !== BOT_ID) {
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
              const result = responses[0].queryResult
              // final confirmation of event

              if (result.action !== 'input.welcome' && result.allRequiredParamsPresent
              // && result.parameters.fields.subject.stringValue && result.parameters.fields.date.stringValue
              ) {
                generateMessage(result, event.channel, slackId, function (message) {
                  web.chat.postMessage(message)
                })
              } else {
              // web.chat.postMessage(result.fulfillmentText);
                rtm.sendMessage(result.fulfillmentText, event.channel)
              }

              if (result.intent === 'cancel-meeting') {
              // console.log(`  Intent: ${result.intent.displayName}`)
              } else {
              // console.log(`  No intent matched.`)
              }
            }).then(msg => console.log('message sent')
            )
        }
      })
      .catch((err) => console.log('errrororor', err))
  }
})

app.get('/google/event', function (req, res) {
  let subject = req.query.subject
  let date = req.query.date
  let slackId = req.query.slackId
  let channel = req.query.channel
  let tokens = {}
  let intent = req.query.intent
  let fields = req.query.fields
  let userId = ''
  // get tokens''o make API calls
  console.log('slackid', slackId)
  User.findOne({
    slackId: slackId
  })
    .exec()
    .then((user) => {
      if (!user || !user.access_token) {
        console.log('no user found')
        res.status(500).send('internal error')
      } else {
        tokens = {
          access_token: user.access_token,
          refresh_token: user.refresh_token,
          expiry_date: user.expiry_date
        }
        userId = user._id
        // store a pendingTask in User model in case google calendar api fails
        console.log('hope you are here: subject is', subject)
        user.pendingTask = {
          subject: subject,
          status: 'pending'
        }
      }
      return user
    }).then(user => {
      makeCalendarAPICall(tokens, userId, fields, intent)
        .then((success) => {
          // clear pendingTask
          console.log('clearing pendingTask')
          user.pendingTask = {}
          // web.chat.postMessage({
          //   'text': 'Added this to your calendar',
          //   'channel': req.query.channel,
          //   'token': token
          // })
          user.save()
            .then(() => res.redirect(`https://${slackTeam}.slack.com/messages/${req.query.channel}/`))
            .catch((err) => {
              console.log('error!!!', err)
              res.status(500).send('1 internal error')
            })
        })
        .catch((err) => {
          console.log('error', err)
          res.status(500).send('2 internal error')
        })
    })
})

function generateMessage (result, channel, slackId, callback) {
  let action = ''
  let date = ''
  let subject = ''
  let time = ''
  let invitees = ''
  let url = ''
  let buttons = []

  console.log(slackId, 'slackid123')

  if (result.intent.displayName === 'remind') {
    subject = result.parameters.fields.subject.stringValue
    date = new Date(result.parameters.fields.date.stringValue)
    let fields = encodeURIComponent(JSON.stringify(result.parameters.fields))
    console.log('FIELDS', fields)
    // date.slice(0, 10);
    console.log(date, JSON.stringify(date), 'Dates in generate message')
    let uriSubject = encodeURIComponent(subject)
    url = `${process.env.DOMAIN}/google/event?fields=${fields}&slackId=${slackId}&channel=${channel}&intent=remind`
    // url = `${routingUrl}/google/event?date=${date.toISOString()}&subject=${uriSubject}&slackId=${slackId}&channel=${channel}&intent=remind`  //remember to add date to the query
    action = `Reminder to ${subject} on ${date.toDateString()}`

    buttons = [{
      'name': 'yes',
      'text': 'Yes',
      'type': 'button',
      'value': url
      // 'url': url
      // "url": `${routingUrl}/google/event?subject=${subject}&date=${date}&slackId=${slackId}`
    },
    {
      'name': 'no',
      'text': 'No',
      'type': 'button',
      'value': 'no'
      // 'url': handlesNo
    }]

    callback({
      'text': 'Would you like to add this to your calendar?',
      'channel': channel,
      'token': token,
      'attachments': [
        {
          'text': action,
          'fallback': "Shame... buttons aren't supported in this land",
          'callback_id': 'button_tutorial',
          'color': '#3AA3E3',
          'attachment_type': 'default',
          'actions': buttons
        }
      ]
    })
  } else if (result.intent.displayName === 'scheduler') {
    let fields = encodeURIComponent(JSON.stringify(result.parameters.fields))
    date = new Date(result.parameters.fields.date.stringValue)
    time = new Date(result.parameters.fields.time.stringValue).toTimeString()
    invitees = result.parameters.fields.invitees.listValue.values.map(p => p.stringValue)
    // url = `${routingUrl}/google/event?date=${date}&time=${time}&invitees=${invitees}&slackId=${slackId}&channel=${channel}&intent=schedule`
    url = `${process.env.DOMAIN}/google/event?fields=${fields}&slackId=${slackId}&channel=${channel}&intent=schedule`
    action = `A meeting is scheduled on ${date.toDateString()} at ${time} with ${invitees}`
    buttons = [{
      'name': 'yes',
      'text': 'Yes',
      'type': 'button',
      'value': url
      // 'url': url
      // "url": `${routingUrl}/google/event?subject=${subject}&date=${date}&slackId=${slackId}`
    },
    {
      'name': 'no',
      'text': 'No',
      'type': 'button',
      'value': 'no'
      // 'url': handlesNo
    }]

    callback({
      'text': 'Would you like to add this to your calendar?',
      'channel': channel,
      'token': token,
      'attachments': [
        {
          'text': action,
          'fallback': "Shame... buttons aren't supported in this land",
          'callback_id': 'button_tutorial',
          'color': '#3AA3E3',
          'attachment_type': 'default',
          'actions': buttons
        }
      ]
    })
  } else if (result.intent.displayName === 'cancel-meeting') {
    let fields = encodeURIComponent(JSON.stringify(result.parameters.fields))
    date = new Date(result.parameters.fields.date.stringValue)
    console.log('FIELDS', fields)

    User.findOne({slackId: slackId})
      .then(user => {
        console.log(user)
        return user._id
      })
      .then(id => {
        Meeting.find({requesterId: id})// {requesterId: id}
          .then(possibleMeetings => {
            possibleMeetings.forEach(mtg => {
              let ids = JSON.stringify({
                eventID: mtg.eventID
              })
              // get meetings on the same day to be displayed to user
              let day1 = mtg.start.substring(0, 10)
              let day2 = date.toISOString().substring(0, 10)
              if (day1 === day2) {
                buttons.push({
                  'name': 'cancel',
                  'text': mtg.subject + '@' + mtg.start,
                  'type': 'button',
                  'value': `${process.env.DOMAIN}/google/event?fields=${encodeURIComponent(ids)}&slackId=${slackId}&channel=${channel}&intent=cancel`
                })
              }
            })
            return buttons
          }).then(buttons => {
            console.log('cancel buttons', buttons, channel)
            if (buttons.length === 0) {
              callback({
                'text': 'No Meetings scheduled on this date',
                'channel': channel,
                'token': token
                })
            } else {
              callback({
                'text': 'Select the meeting to cancel',
                'channel': channel,
                'token': token,
                'attachments': [
                  {
                    'text': '',
                    'fallback': "Shame... buttons aren't supported in this land",
                    'callback_id': 'button_tutorial',
                    'color': '#3AA3E3',
                    'attachment_type': 'default',
                    'actions': buttons
                  }
                ]
              })
            }
          })
      })
  }
}
app.post('/slack', function (req, res) {
  let payload = JSON.parse(req.body.payload)
  let {name, value} = payload.actions[0]
  // console.log("name value", name, value);
  // res.send("ok");
  if (name === 'yes') {
    axios(value.replace(/;/g, '&'))
      .then(() => res.status(200).send('added to calendar'))
      .catch((err) => console.log('error', err))
  } else if (name === 'no') {
    res.send('Okay. Action cancelled')
  } else if (name === 'cancel') {
    axios(value.replace(/;/g, '&'))
      .then(() => res.status(200).send('meeting cancelled'))
      .catch((err) => console.log('error', err))
  }
})

// app.get('/yesRoute', (req, res) => {
//   console.log('123456789', req.query.subject, req.query.date, req.query.channel)
//   web.chat.postMessage({
//     'text': 'Added this to your calendar',
//     'channel': req.query.channel,
//     'token': token
//   })
//   res.redirect(`https://${slackTeam}.slack.com/messages/${req.query.channel}/`)
// })

// TODO: handles no button
app.get('/noRoute', (req, res) => {
  console.log('chose no', req.query.subject, req.query.date, req.query.channel)
  web.chat.postMessage({
    'text': 'Action cancelled',
    'channel': req.query.channel,
    'token': token
  })
  // res.status(200).end();
  res.redirect(`https://${slackTeam}.slack.com/messages/${req.query.channel}/`)
})

/* GOOGLE API OAUTH ROUTES */
// GET route that redirects to google oatuh2 url
app.get('/google/calendar', function (req, res) {
  console.log('get google calendar route')
  // TODO: get slackId, task, and action from slack
  let slackId = req.query.slackId || 'myslackId'
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
              // offline because we're server
              access_type: 'offline',
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
            access_type: 'offline',
            // refresh_token only returned on the first authorization
            scope: scopes,
            state: encodeURIComponent(JSON.stringify({
              auth_id: user._id
            })),
            prompt: 'consent'
          })
          res.redirect(url)
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
          res.status(200).send('Successfully authenticated. You may now go back to Slack to send the message again')
        }
      })
      .catch((err) => {
        console.log('errorrrr', err)
        res.status(500).send('internal error')
      })
  })
})

app.listen(port || process.env.PORT)

// models
const User = require('./models').User
const Task = require('./models').Task

// google api setup
const {google} = require('googleapis')

// which apis i use
const scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar'
]

async function addEvent (oauth2Client) {
  // access calendar on behalf of this new client
  const calendar = google.calendar({version: 'v3', auth: oauth2Client})

  return new Promise((resolve, reject) => {
    calendar.event.insert({
      calendarId: 'primary',
      summary: 'eat fish',
      location: '800 Howard St., San Francisco, CA 94103',
      'description': 'A chance to hear more about Google\'s developer products.',
      start: {
        date: new Date(Date.now() + 30000) // 30 seconds from now
      },
      end: {
        date: new Date(Date.now() + 90000)
      }
    }, (err, {data}) => {
      if (err) {
        console.log('The API returned an error: ' + err)
        reject(err) // return the error object
      } else {
        console.log('success:', data)
        resolve(data) // return the resulting event object
      }
    })
  })
}

async function listEvents (oauth2Client) {
  // access calendar on behalf of this new client
  const calendar = google.calendar({version: 'v3', auth: oauth2Client})

  return new Promise((resolve, reject) => {
    calendar.events.list({
      calendarId: 'primary', // customizable
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, (err, {data}) => {
      if (err) {
        console.log('The API returned an error: ' + err)
        reject(err) // return the error object
      } else {
        const events = data.items
        if (events.length) {
          console.log('Upcoming 10 events:')
          events.map((event, i) => {
            const start = event.start.dateTime || event.start.date
            console.log(`${start} - ${event.summary}`)
          })
          resolve(events) // return the array of events
        } else {
          console.log('No upcoming events found.')
          resolve(events)
        }
      }
    })
  })
}

// need to supply an object called tokens with 3 fields:
// access_token, refresh_token, expiry_date
function makeCalendarAPICall (tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.DOMAIN + '/google/callback'
  )

  // talk to google api on their behalf
  oauth2Client.setCredentials(tokens)

  // google calls this when the current access token is expired,
  // giving you a new refresh token
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database
      User.findOne({
        access_token: tokens.access_token
      })
        .exec()
        .then((user) => {
          if (!user) {
            console.log('user not found')
            res.status(500).send('database error')
          } else {
            user.refresh_token = tokens.refresh_token
            user.save()
          }
        })
        .catch((err) => {
          console.log('errorrrr', err)
        })
    } else {
      console.log('no refresh token', tokens)
    }
  })

  const action = 'insert';

  // do tasks accordingly
  if (action === 'insert') {
    console.log('action is insert')
    addEvent(oauth2Client)
      .then((event) => {
        console.log('event added:', event)
      })
      .catch((err) => {
        console.log('error:', err)
      })
    // get a list of upcoming events for time conflict checking
    listEvents(oauth2Client)
      .then((events) => {
        console.log('Events', events)
      })
  } else if (action === 'delete') {
    console.log('action is delete')
  } else {
    console.log('action is', action)
  }
}

module.exports = {
  scopes,
  makeCalendarAPICall
}

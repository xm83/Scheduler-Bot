// models
const User = require('./models').User;
const Meeting = require('./models').Meeting;
// const Task = require('./models').Task

// google api setup
const {google} = require('googleapis')

// which apis i use
const scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar'
]

async function addReminder (oauth2Client, subject, date) {
  // access calendar on behalf of this new client
  const calendar = google.calendar({version: 'v3', auth: oauth2Client})
  console.log('the date', date);

  let newDate = new Date(date);

  console.log('new date', newDate);
  let days = newDate.getDate();
  newDate.setDate(days+1);

  return new Promise((resolve, reject) => {
    calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: subject,
        start: {
          date: new Date(date).toISOString().substring(0, 10) // yyyy-mm-dd
        },
        end: {
          date: new Date(newDate).toISOString().substring(0, 10)
        }
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

async function addSchedule (oauth2Client, invitees, date, time, subject) {
  // access calendar on behalf of this new client
  const calendar = google.calendar({version: 'v3', auth: oauth2Client})
  console.log('the date', date);

  var timeStr = new Date(date);
  console.log(timeStr);
  timeStr.setHours(time.getHours(), time.getMinutes(), time.getSeconds())
  var endStr = new Date(new Date(timeStr).getTime() + (60000 * 30)).toISOString();
  console.log(timeStr, endStr);

  return new Promise((resolve, reject) => {
    calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: subject ? subject : `Meeting with ${invitees}`,
        start: {
          dateTime: timeStr.toISOString()
        },
        end: {
          dateTime: endStr
        },
        attendees: invitees
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

async function deleteEvent (oauth2Client, calendarID, eventID) {
  // access calendar on behalf of this new client
  const calendar = google.calendar({version: 'v3', auth: oauth2Client})

  return new Promise((resolve, reject) => {
    calendar.events.delete({
      calendarId: calendarID, // customizable
      eventId: eventID
    }, (err, {data}) => {
      if (err) {
        console.log('The API returned an error: ' + err)
        reject(err) // return the error object
      } else {
        console.log('event deleted:', data)
        resolve(data) // return the resulting event object
      }
    })
  })
}

// need to supply an object called tokens with 3 fields:
// access_token, refresh_token, expiry_date
async function makeCalendarAPICall (tokens, id, fields, intent) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.DOMAIN + '/google/callback'
  )

  // talk to google api on their behalf
  oauth2Client.setCredentials(tokens)
  // let userId = ''

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
            // userId = user._id
            // console.log('USER ID!!!!!!', userId);
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
  fields = JSON.parse(fields);
  console.log(fields);

  // do tasks accordingly
  if (action === 'insert') {
    console.log('action is insert')
    console.log('INTENT: ', intent);
    return new Promise((resolve, reject) => {
      if (intent === 'remind') {
        const subject = fields.subject.stringValue;
        const date = new Date(fields.date.stringValue);
        addReminder(oauth2Client, subject, date)
          .then((event) => {
            console.log('reminder added:', event);
            resolve('success');
          })
          .catch((err) => {
            console.log('error:', err)
            reject(err);
          })
      }
      else if (intent === 'schedule') {
        const invitees = fields.invitees.listValue.values.map(p => p.stringValue);
        const date = new Date(fields.date.stringValue)
        const time = new Date(fields.time.stringValue);
        const subject = fields.subject ? fields.subject.stringValue : null;
        console.log(invitees, date, time);
        addSchedule(oauth2Client, invitees, date, time, subject)
          .then((event) => {
            console.log('schedule added:', event);
            const restartDate = new Date(event.start.dateTime);
            restartDate.setHours(0, 0, 0);
            var newMeeting = new Meeting({
              day: restartDate,
              start: event.start.dateTime,
              end: event.end.dateTime,
              invitees: invitees,
              requesterId: id,
              subject: event.summary,
              createdAt: new Date(event.created),
              eventID: event.id,
              calendarID: event.iCalUID,
            })

            newMeeting.save()
            .then(saved => console.log('saved new meeting'))
            // .catch(err=> console.log('cannot save new meeting'));

            resolve('success');
          })
          .catch((err) => {
            console.log('error:', err)
            reject(err);
          })
      } else if (intent === 'cancel') {
        const calendarID = fields.calendarID;
        const eventID = fields.eventID;
        deleteEvent(oauth2Client, calendarID, eventID)
          .then((event) => {
            console.log('event deleted:', event);
            resolve('success');
          })
          .catch((err) => {
            console.log('error:', err)
            reject(err);
          })
      }
    })
    // get a list of upcoming events for time conflict checking
    // listEvents(oauth2Client)
    //   .then((events) => {
    //     console.log('Events', events)
    //   })
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

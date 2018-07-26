const mongoose = require('mongoose');
const connect = process.env.MONGODB_URI;

mongoose.connect(connect);
const Schema = mongoose.Schema;

// Schemas

const userSchema = Schema({
  access_token: String,
  refresh_token: String,
  profileId: String,
  expiry_date: String,
  defaultSetting: {
    meetingLength: {
      type: Number,
      default: 30
    }
  },
  slackId: String,
  slackUsername: String,
  slackEmail: String,
  slackDMId: String,
  pendingTask: {
    subject: String,
    date: String,
    status: String
  }
})


// const taskSchema = Schema({
//   subject: {
//     type: String,
//     required: true
//   },
//   day: {
//     type: String,
//     required: true
//   },
//   status: String, // pending or scheduled
//   gCalEventId: String,
//   requesterId: {
//     type: Schema.Types.ObjectId,
//     ref: 'User'
//   }
// });

const meetingSchema = Schema({
  day: {
    type: Date,
    required: true
  },
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  },
  invitees: [],
  eventId: String,
  // invitees: {
  //   type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  //   default: [],
  //   required: true
  // },
  subject: String,
  // status: String, // pending or scheduled
  createdAt: {
    type: Date
  },
  requesterId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  eventID: {
    type: String,
    required: true
  },
  calendarID: {
    type: String,
    required: true
  }
  // google calendar fields
});

// Convert Schemas to Models
const User = mongoose.model('User', userSchema);
const Meeting = mongoose.model('Meeting', meetingSchema);
// const Meeting = mongoose.model('Meeting', meetingSchema);
// const Task = mongoose.model('Task', taskSchema);

module.exports = {
  User,
  Meeting
  // Meeting,
  // Task
};

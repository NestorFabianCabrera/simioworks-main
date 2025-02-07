const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Schema = mongoose.Schema;

const inviteCodeSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60 // Los códigos expiran después de 7 días
  }
});

const groupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  identifier: {
    type: String,
    default: () => uuidv4(),
    unique: true
  },
  avatar: {
    type: String,
    default: null
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['creator', 'member'],
      required: true
    }
  }],
  inviteCodes: [inviteCodeSchema],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }]
}, {
  timestamps: true
});

// Middleware para actualizar updatedAt antes de guardar
groupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;

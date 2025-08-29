const mongoose = require('mongoose');
const { Schema } = mongoose;

const progressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  LessonName: {
    type: String,
    required: true
  },
  taskName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Progress || mongoose.model('Progress', progressSchema);


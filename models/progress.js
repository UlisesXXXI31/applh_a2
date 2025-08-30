// backend/models/progress.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const progressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Referencia al modelo 'User' por su nombre
    required: true
  },
  lessonName: { // 'N' mayúscula para consistencia
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

// Exportar usando el patrón "singleton"
module.exports = mongoose.models.Progress || mongoose.model('Progress', progressSchema);

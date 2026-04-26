import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema(
  {
    questionId: {type: String, required: true},
    value: {type: mongoose.Schema.Types.Mixed, required: true}
  },
  {_id: false}
)

const responseSchema = new mongoose.Schema(
  {
    form: {type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true},
    answers: {type: [answerSchema], default: []},
    submittedAt: {type: Date, default: Date.now}
  },
  {timestamps: true}
)

export const Response = mongoose.model('Response', responseSchema)
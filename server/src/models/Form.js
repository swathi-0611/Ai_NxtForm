import mongoose from 'mongoose'

const optionSchema = new mongoose.Schema(
  {
    label: {type: String, required: true},
    value: {type: String, required: true}
  },
  {_id: false}
)

const questionSchema = new mongoose.Schema(
  {
    id: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, default: ''},
    type: {
      type: String,
      enum: ['short_text', 'long_text', 'email', 'number', 'select', 'radio', 'checkbox', 'date'],
      required: true
    },
    required: {type: Boolean, default: false},
    placeholder: {type: String, default: ''},
    options: {type: [optionSchema], default: []},
    validation: {
      minLength: {type: Number},
      maxLength: {type: Number},
      min: {type: Number},
      max: {type: Number},
      pattern: {type: String}
    }
  },
  {_id: false}
)

const formSchema = new mongoose.Schema(
  {
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    title: {type: String, required: true},
    description: {type: String, default: ''},
    prompt: {type: String, required: true},
    slug: {type: String, required: true, unique: true},
    status: {type: String, enum: ['draft', 'published'], default: 'draft'},
    theme: {
      accent: {type: String, default: '#ff6b35'},
      surface: {type: String, default: '#fff8ef'}
    },
    questions: {type: [questionSchema], default: []}
  },
  {timestamps: true}
)

export const Form = mongoose.model('Form', formSchema)
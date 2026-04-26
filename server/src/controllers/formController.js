import {Form} from '../models/Form.js'
import {Response} from '../models/Response.js'
import {generateFormSchema} from '../services/aiService.js'
import {buildSchemaFromFieldListInput, buildSchemaFromPrompt, toSlugBase} from '../utils/formTemplates.js'

const isOwner = (form, userId) => String(form.owner) === String(userId)

const buildUniqueSlug = async (title) => {
  const base = toSlugBase(title) || 'ai-form'
  let slug = base
  let count = 1

  while (await Form.exists({slug})) {
    slug = `${base}-${count}`
    count += 1
  }

  return slug
}

export const createFormFromPrompt = async (req, res) => {
  const {prompt} = req.body

  if (!prompt?.trim()) {
    return res.status(400).json({message: 'Prompt is required'})
  }

  if (process.env.DEBUG_AI === 'true') {
    console.log('[createFormFromPrompt] prompt:', prompt.trim())
  }

  const trimmedPrompt = prompt.trim()
  const direct = buildSchemaFromFieldListInput(trimmedPrompt)
  const derived = direct || buildSchemaFromPrompt(trimmedPrompt)
  const generated = direct
    ? {...direct, meta: {provider: 'field-list'}}
    : derived && derived.questions.length >= 2
      ? {...derived, meta: {provider: 'prompt-parser'}}
      : await generateFormSchema(trimmedPrompt)

  if (process.env.DEBUG_AI === 'true') {
    console.log('[createFormFromPrompt] provider:', generated?.meta?.provider, 'reason:', generated?.meta?.reason || 'n/a')
    console.log(
      '[createFormFromPrompt] questions:',
      (generated?.questions || []).map((q) => ({id: q.id, title: q.title, type: q.type, required: q.required}))
    )
  }
  const slug = await buildUniqueSlug(generated.title)

  const form = await Form.create({
    owner: req.user._id,
    title: generated.title,
    description: generated.description,
    prompt: trimmedPrompt,
    slug,
    questions: generated.questions,
    status: 'draft'
  })

  if (process.env.DEBUG_AI === 'true') {
    console.log('[createFormFromPrompt] saved form questions:', form.questions.map((q) => ({id: q.id, title: q.title, type: q.type})))
  }

  return res.status(201).json({
    form,
    meta: generated.meta
  })
}

export const listForms = async (req, res) => {
  const forms = await Form.find({owner: req.user._id}).sort({createdAt: -1})
  res.json(forms)
}

export const getFormById = async (req, res) => {
  const form = await Form.findById(req.params.id)

  if (!form) {
    return res.status(404).json({message: 'Form not found'})
  }

  if (!isOwner(form, req.user._id)) {
    return res.status(403).json({message: 'You do not have access to this form'})
  }

  return res.json(form)
}

export const updateForm = async (req, res) => {
  const payload = req.body
  const form = await Form.findById(req.params.id)

  if (!form) {
    return res.status(404).json({message: 'Form not found'})
  }

  if (!isOwner(form, req.user._id)) {
    return res.status(403).json({message: 'You do not have access to this form'})
  }

  const titleChanged = Boolean(payload.title && payload.title !== form.title)

  form.title = payload.title ?? form.title
  form.description = payload.description ?? form.description
  form.questions = payload.questions ?? form.questions
  form.status = payload.status ?? form.status
  form.theme = payload.theme ?? form.theme

  if (titleChanged) {
    form.slug = await buildUniqueSlug(payload.title)
  }

  await form.save()
  return res.json(form)
}

export const getPublicForm = async (req, res) => {
  const form = await Form.findOne({slug: req.params.slug, status: 'published'}).select('-prompt')

  if (!form) {
    return res.status(404).json({message: 'Published form not found'})
  }

  return res.json(form)
}

export const submitResponse = async (req, res) => {
  const form = await Form.findOne({slug: req.params.slug, status: 'published'})

  if (!form) {
    return res.status(404).json({message: 'Published form not found'})
  }

  const answers = Array.isArray(req.body.answers) ? req.body.answers : []
  const requiredQuestionIds = form.questions.filter((question) => question.required).map((question) => question.id)
  const submittedQuestionIds = new Set(answers.map((answer) => answer.questionId))

  const missing = requiredQuestionIds.filter((questionId) => !submittedQuestionIds.has(questionId))

  if (missing.length > 0) {
    return res.status(400).json({message: 'Missing required answers', missing})
  }

  const response = await Response.create({
    form: form._id,
    answers
  })

  return res.status(201).json(response)
}

export const getDashboard = async (req, res) => {
  const form = await Form.findById(req.params.id)

  if (!form) {
    return res.status(404).json({message: 'Form not found'})
  }

  if (!isOwner(form, req.user._id)) {
    return res.status(403).json({message: 'You do not have access to this form'})
  }

  const responses = await Response.find({form: form._id}).sort({createdAt: -1})
  const latestResponses = responses.slice(0, 10)

  res.json({
    form,
    summary: {
      totalResponses: responses.length,
      published: form.status === 'published',
      questionCount: form.questions.length
    },
    latestResponses
  })
}
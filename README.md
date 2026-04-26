# AI Form Builder (Typeform Clone)

A MERN starter for an AI-assisted form builder inspired by Typeform.

## What it includes

- AI prompt to form schema generation
- Multi-step form filling experience
- Shareable public form links
- Response dashboard with summary stats
- MERN structure with React frontend and Express + MongoDB backend
- Deterministic fallback schema generation when no AI API key is configured

## Stack

- MongoDB
- Express
- React + Vite
- Node.js
- Optional AI provider via `GROQ_API_KEY`

## Project structure

- `client` - React app
- `server` - Express API


## Core flows

- Builder creates a form from a prompt
- Form schema can be edited before publishing
- Public users fill the form using a step-by-step interface
- Responses are stored and shown in a dashboard

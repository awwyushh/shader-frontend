# WASM Calculator and ShaderGen

This project is a modern web application featuring a glassmorphic UI with two main components: a Calculator and a Shader Generator (ShaderGen). The frontend is built with Next.js and React, while the backend utilizes Rust (compiled to WebAssembly) for the calculator and Elixir with Google's Gemini AI for the shader generator.

## Features

- **Glassmorphic UI**: A sleek, modern interface with a glass-like effect.
- **Calculator**: Powered by Rust compiled to WebAssembly for high-performance calculations.
- **ShaderGen**: An AI-powered shader generator using Elixir backend and Google's Gemini.
- **Responsive Design**: Fully responsive layout that works on desktop and mobile devices.

## Technologies Used

### Frontend
- React 18+
- Tailwind CSS
- react-syntax-highlighter

### Backend
- Rust (compiled to WebAssembly) for the Calculator
- Elixir for the ShaderGen backend
- Google Gemini AI for shader generation

## Prerequisites

- Node.js 14.x or later
- Rust toolchain (for compiling the calculator to WebAssembly)
- Elixir 1.12 or later (for the ShaderGen backend)
- Google Cloud account with Gemini API access

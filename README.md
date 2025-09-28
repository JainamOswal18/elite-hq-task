# ResumePilot 🚀

**AI-Powered LaTeX Resume Builder with Live Preview**

ResumePilot is a modern, full-stack web application that combines the power of LaTeX typesetting with AI-driven content generation and real-time PDF preview. Built with Next.js, Supabase, and Google Gemini AI.

![ResumePilot Screenshot](./docs/screenshot.png)

## ✨ Features

- **🎨 Monaco-based LaTeX Editor** - Professional code editor with syntax highlighting, auto-completion, and error detection
- **📄 Live PDF Preview** - Real-time PDF compilation and preview with zoom controls
- **🤖 AI Resume Generation** - Google Gemini AI integration for intelligent resume content creation
- **📱 Responsive Split-Pane UI** - Optimized for desktop and mobile with resizable panels
- **🎯 Three Professional Templates**:
  - **Modern Professional** - Clean, ATS-friendly design for tech and business
  - **Academic Classic** - Traditional format for researchers and educators
  - **Creative Minimal** - Stylish design with visual elements for creative professionals
- **☁️ Supabase Integration** - User authentication and cloud storage
- **🎨 Beautiful Theme** - Deep blue/teal/light-gray color scheme with Inter font
- **⚡ Fast PDF Compilation** - Optimized LaTeX compilation with error handling
- **📤 PDF Export** - One-click download of generated resumes
- **🐳 Docker Ready** - Full TeX Live environment for production deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker (optional, for LaTeX compilation)
- Supabase account
- Google AI API key

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resume-pilot.git
   cd resume-pilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   PDFLATEX_API_URL=http://localhost:3001
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

For production deployment with full LaTeX support:

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individual services
docker build -t resume-pilot .
docker build -f Dockerfile.latex -t latex-compiler .
```

## 📋 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `GOOGLE_AI_API_KEY` | Google Gemini AI API key | ✅ |
| `PDFLATEX_API_URL` | LaTeX compilation service URL | ⚠️ |
| `NODE_ENV` | Environment (development/production) | ⚠️ |

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Next.js API    │    │  LaTeX Service  │
│   (React/Next)  │◄──►│   Routes         │◄──►│  (pdflatex)     │
│                 │    │                  │    │                 │
│ • Monaco Editor │    │ • /api/compile   │    │ • PDF Generation│
│ • PDF Viewer    │    │ • /api/templates │    │ • Error Handling│
│ • AI Interface  │    │ • /api/ai        │    │ • Caching       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   Supabase      │    │   Google AI      │
│                 │    │                  │
│ • Authentication│    │ • Content Gen    │
│ • File Storage  │    │ • Template Fill  │
│ • Database      │    │ • Optimization   │
└─────────────────┘    └──────────────────┘
```

## 🎨 Templates

### Modern Professional
- Clean, contemporary design
- ATS-friendly formatting
- Perfect for tech and business roles
- Includes contact links and modern styling

### Academic Classic
- Traditional academic format
- Publications and research sections
- Citation-ready formatting
- Ideal for researchers and educators

### Creative Minimal
- Stylish design with visual elements
- Color accents and modern typography
- Perfect for creative professionals
- Portfolio-ready layout

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/compile` | POST | Compile LaTeX to PDF |
| `/api/templates/[template]` | GET | Get template content |
| `/api/ai/generate` | POST | Generate resume with AI |
| `/api/auth/*` | * | Supabase authentication |

## 📱 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save resume |
| `Ctrl/Cmd + E` | Export PDF |
| `Ctrl/Cmd + B` | Bold text |
| `Ctrl/Cmd + I` | Italic text |
| `Ctrl/Cmd + 1` | Editor view |
| `Ctrl/Cmd + 2` | Preview view |
| `Ctrl/Cmd + 3` | Split view |

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Docker Production

```bash
# Build production image
docker build -t resume-pilot:prod .

# Run with environment variables
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e GOOGLE_AI_API_KEY=your_key \
  resume-pilot:prod
```

### Self-Hosted

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the server**
   ```bash
   npm start
   ```

## 🔒 Security Features

- **CORS Protection** - Configured for secure cross-origin requests
- **Input Validation** - LaTeX content sanitization
- **Rate Limiting** - API endpoint protection
- **Secure Headers** - Security-first configuration
- **Environment Isolation** - Separate dev/prod configurations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.resumepilot.dev](https://docs.resumepilot.dev)
- **Issues**: [GitHub Issues](https://github.com/yourusername/resume-pilot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/resume-pilot/discussions)
- **Email**: support@resumepilot.dev

## 🎯 Roadmap

- [ ] **Real-time Collaboration** - Multiple users editing simultaneously
- [ ] **Version History** - Track and restore previous versions
- [ ] **Template Marketplace** - Community-contributed templates
- [ ] **Advanced AI Features** - Job-specific optimization
- [ ] **Integration APIs** - Connect with job boards and ATS systems
- [ ] **Mobile App** - Native iOS and Android applications

## 🙏 Acknowledgments

- **Next.js** - The React framework for production
- **Supabase** - The open source Firebase alternative
- **Monaco Editor** - The code editor that powers VS Code
- **LaTeX** - The document preparation system
- **Google AI** - Gemini AI for content generation
- **Tailwind CSS** - A utility-first CSS framework

---

**Built with ❤️ by the ResumePilot Team**

*Star ⭐ this repo if you find it helpful!*

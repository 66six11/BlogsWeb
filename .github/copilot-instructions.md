# GitHub Copilot Instructions for BlogsWeb

## Project Overview

BlogsWeb (MagicDev) is a personal blog and portfolio website inspired by the anime "Wandering Witch: The Journey of Elaina." It combines modern web technologies with a magical-themed visual design to provide an immersive browsing experience.

## Technology Stack

### Core Technologies
- **React 19.2.0** - Latest React with concurrent rendering
- **TypeScript 5.8.2** - Type-safe JavaScript with strict type checking
- **Vite 6.2.0** - Next-generation frontend build tool
- **Tailwind CSS 4.1.17** - Utility-first CSS framework with custom theme
- **React Router DOM 7.10.1** - Client-side routing

### Key Libraries
- **Three.js 0.160.0** - WebGL 3D rendering for particle systems and animations
- **Tone.js 14.7.77** - Web Audio framework for music playback
- **abcjs 6.5.2** - ABC music notation parser supporting ABC v2.1 standard
- **class-variance-authority (CVA)** - Type-safe component variants
- **Lucide React** - Icon library
- **Google Gemini API** - AI chat functionality

## Project Architecture

### Directory Structure
```
src/
├── components/
│   ├── common/          # Shared components (ThemeToggle, LoadingScreen, ErrorBoundary)
│   ├── layout/          # Layout components (Navigation, Footer)
│   ├── features/        # Feature-specific components
│   │   ├── music/       # Music player, piano editor, ABC parser
│   │   ├── chat/        # AI chat with Gemini
│   │   ├── 3d/          # Three.js scenes and particle systems
│   │   └── content/     # Markdown/Obsidian renderers
│   ├── icons/           # Custom icon components
│   ├── ui/              # Reusable UI components with CVA
│   └── dev/             # Development-only components (code-split)
├── pages/               # Page components (AboutPage, BlogPage, ProjectsPage)
├── services/            # API services (githubService, geminiService)
├── types/               # TypeScript type definitions
├── config/              # User-configurable settings
├── constants/           # Application constants
├── data/                # Mock data and helpers
├── lib/                 # Utility functions
└── styles/              # Global styles
```

## Code Conventions

### TypeScript
- **Always use TypeScript** for all files (`.tsx` for components, `.ts` for utilities)
- **Enable strict type checking** - no `any` types unless absolutely necessary
- **Use proper type annotations** - prefer explicit types over inference for function parameters and returns
- **Define interfaces** for all data structures in `src/types/index.ts`
- **Path aliases**: Use `@/*` for imports (e.g., `import { Button } from '@/components/ui/Button'`)

### React Components
- **Use functional components** with hooks
- **Use TypeScript for props** - define `interface ComponentNameProps` for all components
- **Component naming**: PascalCase for components, camelCase for functions
- **File structure**: One component per file, named same as the file
- **Exports**: Use named exports for components

### UI Components (CVA Pattern)
All UI components in `src/components/ui/` follow the CVA (class-variance-authority) pattern:
- Use `cva()` to define component variants with type-safe props
- Export both the variant function and the component
- Example structure:
  ```typescript
  import { cva, type VariantProps } from "class-variance-authority";
  
  const componentVariants = cva("base-classes", {
    variants: {
      variant: { ... },
      size: { ... }
    },
    defaultVariants: { ... }
  });
  
  export interface ComponentProps extends VariantProps<typeof componentVariants> {
    // additional props
  }
  
  export const Component = ({ variant, size, ...props }: ComponentProps) => {
    return <div className={componentVariants({ variant, size })} {...props} />;
  };
  ```

### Styling
- **Use Tailwind CSS** utility classes exclusively
- **Follow theme configuration** in `src/config/index.ts` for colors
- **Responsive design**: Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, etc.)
- **Dark mode**: Use `dark:` prefix for dark theme variants
- **Custom colors**: Reference theme colors from config, don't hardcode hex values

### Music and ABC Notation
- **ABC v2.1 Standard**: The ScoreParser.ts fully supports ABC v2.1 specification
- **88-key piano range**: A0-C8 (octaves 0-8)
- **Use clampOctave()**: Always clamp octave values to valid range [0, 8]
- **Type safety for ties**: Use `ParsedNote` type (extends `Note` with `_hasTie`) for internal parsing
- **No `any` assertions**: Maintain type safety when handling tie markers
- **Supported features**: dotted notes, ties, grace notes, tuplets, slurs, chords with independent durations

### Markdown and Content Rendering
- **ObsidianRenderer**: Supports full Obsidian syntax including:
  - YAML front matter
  - Highlight `==text==`
  - Strikethrough `~~text~~`
  - Collapsible callouts with +/-
  - Nested callouts
  - Mermaid diagrams (loaded from CDN)
  - Tags `#tag`
  - HTML/Obsidian comments
- **MarkdownRenderer**: Recursive parsing with priority order: code > highlight > strikethrough > bold > italic
- **Article embeds**: Use `![[article]]` syntax with depth limiting
- **MathJax**: Inline math `$...$` and display math `$$...$$` configured in index.html
- **HTML sanitization**: Use multiple-pass regex replacement for HTML comments to prevent injection

### React Router
- **Use React Router** for SPA routing
- **Route order**: Define specific routes before catch-all route (`*`)
- **Dev-only routes**: Place development routes in conditional blocks checking `import.meta.env.DEV`
- **Example**: `/ui-preview` route for component preview, only available in dev mode

### Development Features
- **Dev-only components**: Use `React.lazy()` for code-splitting dev components
- **Preview mode detection**: Use `isPreviewMode()` from `mockData.ts` to detect preview environment
- **URL parameters**: Use `?preview=true` or `?ui-preview=true` for dev features
- **Conditional imports**: Check `import.meta.env.DEV` to prevent inclusion in production

### Security
- **Never commit secrets** - use environment variables
- **API keys**: Store in `.env.local` (not committed), reference via `import.meta.env.VITE_*`
- **Sensitive data**: Never expose API keys or tokens in client-side code
- **Sanitization**: Always sanitize HTML comments and user input
- **Multiple-pass sanitization**: Use do-while loops for complete HTML comment removal

## Development Workflow

### Setup
```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server on port 3000
npm run build                  # Build for production
npm run preview                # Preview production build
```

### Environment Variables
Create `.env.local` file (not committed):
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here
```

### Building
- **Build command**: `npm run build`
- **Output directory**: `dist/`
- **Preview build**: `npm run preview`
- **No linting/testing tools**: There are no linting or testing scripts configured

### Configuration
User-configurable settings in `src/config/index.ts`:
- Site information (title, author, bio, skills)
- GitHub configuration (username, repo, blog path)
- Blog filtering (included folders, excluded paths/files)
- Theme colors (light and dark mode)
- Media configuration (background, music, scores)
- Portfolio projects

## Best Practices

### Component Design
- **Single responsibility**: Each component should do one thing well
- **Composition over inheritance**: Build complex UIs from simple components
- **Prop drilling**: Avoid deep prop drilling, use context when needed
- **Performance**: Use `React.memo()`, `useMemo()`, `useCallback()` when appropriate
- **Lazy loading**: Use `React.lazy()` for heavy components not needed immediately

### State Management
- **Local state first**: Use `useState()` for component-local state
- **Context for shared state**: Use React Context for app-wide state (theme, auth, etc.)
- **Refs for DOM access**: Use `useRef()` for DOM manipulation and mutable values

### Error Handling
- **Error boundaries**: Wrap components in ErrorBoundary for graceful error handling
- **Loading states**: Always show loading indicators during async operations
- **Rate limiting**: Handle GitHub API rate limiting gracefully with fallback to mock data

### Accessibility
- **Semantic HTML**: Use proper HTML elements (`nav`, `main`, `article`, etc.)
- **ARIA labels**: Add `aria-label` to icon buttons and interactive elements
- **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
- **Focus management**: Manage focus for modals and dynamic content

### Performance
- **Code splitting**: Use dynamic imports for routes and heavy components
- **Image optimization**: Use appropriate formats and sizes
- **Debounce/throttle**: Use for expensive operations (scroll, resize, search)
- **Memoization**: Cache expensive computations and prevent unnecessary re-renders

## File Naming
- **Components**: PascalCase (e.g., `MusicPlayer.tsx`, `ThemeToggle.tsx`)
- **Utilities**: camelCase (e.g., `githubService.ts`, `mockData.ts`)
- **Types**: `index.ts` in types folder
- **Config**: `index.ts` in config folder
- **Styles**: `index.css` for global styles

## Import Order
1. React and React-related imports
2. Third-party libraries
3. Internal types and interfaces
4. Internal components
5. Internal utilities and services
6. Constants and config
7. Styles

## Comments
- **Document complex logic**: Add comments for non-obvious code
- **JSDoc for functions**: Document function parameters and return values
- **Module documentation**: Add file-level comments for complex modules (see ScoreParser.ts)
- **Avoid obvious comments**: Don't comment what the code already says

## Git Conventions
- **Commit messages**: Use clear, descriptive messages in present tense
- **Branch names**: Use descriptive names (e.g., `feature/music-player`, `fix/routing-issue`)
- **Small commits**: Make focused commits that address one concern

## Deployment
- **Platform**: Vercel
- **Automatic deployment**: Push to main branch triggers deployment
- **Environment variables**: Configure in Vercel dashboard
- **Serverless functions**: API routes in `api/` directory

## Key Patterns to Follow

### Three.js Integration
- Create scenes in `src/components/features/3d/`
- Clean up geometries, materials, and renderers in `useEffect` cleanup
- Use refs for Three.js objects, not state

### Music Integration
- Use Tone.js for audio playback and synthesis
- Parse ABC notation with ScoreParser.ts
- Support full 88-key piano range (A0-C8)

### GitHub Integration
- Fetch content from GitHub repository via API
- Cache responses to minimize API calls
- Handle rate limiting gracefully
- Fallback to mock data in preview mode

### AI Chat Integration
- Use Google Gemini API via serverless function
- Stream responses for better UX
- Handle errors gracefully

## What to Avoid

- ❌ Don't use `any` type - prefer `unknown` or proper types
- ❌ Don't hardcode colors - use theme configuration
- ❌ Don't commit `.env.local` or secrets
- ❌ Don't use inline styles - use Tailwind classes
- ❌ Don't deeply nest components - keep hierarchy flat
- ❌ Don't use class components - use functional components
- ❌ Don't ignore TypeScript errors - fix them properly
- ❌ Don't mutate state directly - use setState functions
- ❌ Don't forget to cleanup effects (intervals, subscriptions, Three.js objects)
- ❌ Don't use force push - it's disabled on this repo

## Memory-Worthy Facts

When you discover or verify important conventions or patterns while working on this codebase, consider storing them using the `store_memory` tool for future reference. Focus on:
- Build and test commands that work
- Conventions that are consistently followed but not documented
- Important architectural decisions
- Security practices and sanitization patterns
- Performance optimizations that should be replicated

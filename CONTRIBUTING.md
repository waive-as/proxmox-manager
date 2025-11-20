# Contributing to Proxmox Manager Portal

Thank you for your interest in contributing to Proxmox Manager Portal! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Docker and Docker Compose (optional, for testing)
- A Proxmox VE server (for testing)

### Local Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/waive-as/proxmox-manager.git
   cd proxmox-manager
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/waive-as/proxmox-manager.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   cd proxy-server && npm install && cd ..
   ```

5. **Start development servers**:
   ```bash
   # Terminal 1: Frontend
   npm run dev

   # Terminal 2: Proxy server
   cd proxy-server && npm start
   ```

6. **Access the application**:
   - Frontend: http://localhost:8081
   - Proxy: http://localhost:3001

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/description` - Documentation updates

### Creating a Feature Branch

```bash
git checkout main
git pull upstream main
git checkout -b feature/my-new-feature
```

### Making Changes

1. Make your changes in your feature branch
2. Write or update tests for your changes
3. Ensure all tests pass
4. Update documentation if needed
5. Commit your changes with clear commit messages

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(vm): Add VM snapshot functionality

Implements the ability to create, list, and restore VM snapshots
through the Proxmox API.

Closes #123
```

```
fix(auth): Resolve token expiration issue

Fixes a bug where JWT tokens weren't being refreshed properly,
causing users to be logged out unexpectedly.

Fixes #456
```

## Testing

### Running Tests

```bash
# Unit and integration tests
npm test                 # Watch mode
npm run test:run         # Run once
npm run test:coverage    # Generate coverage report

# E2E tests
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run with UI
npm run test:e2e:debug   # Debug mode

# All tests
npm run test:all
```

### Writing Tests

- **Unit tests**: Place in `src/**/__tests__/` or next to the file as `*.test.ts(x)`
- **E2E tests**: Place in `e2e/` directory
- **Coverage requirement**: Minimum 80% coverage for new code
- **Testing tools**: Vitest, React Testing Library, Playwright, MSW

### Test Guidelines

1. Write tests for all new features
2. Update tests when modifying existing features
3. Ensure tests are isolated and don't depend on external services
4. Use meaningful test descriptions
5. Mock external dependencies appropriately

## Submitting Changes

### Pull Request Process

1. **Update your branch** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/my-new-feature
   ```

3. **Create a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Fill out the PR template completely
   - Link related issues
   - Add screenshots for UI changes
   - Request review from maintainers

4. **Address review feedback**:
   - Make requested changes
   - Push new commits to your branch
   - Respond to review comments

5. **Merge requirements**:
   - All tests must pass
   - Code review approval from at least one maintainer
   - No merge conflicts
   - Documentation updated if needed

### Pull Request Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Coverage maintained at 80%+

## Screenshots (if applicable)

## Related Issues
Closes #XXX
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for component props
- Use type inference where appropriate
- Avoid `any` type when possible (current config is relaxed)

### React Components

```typescript
// Preferred component structure
import { useState } from "react";
import { ComponentProps } from "@/types";
import { useCustomHook } from "@/hooks/use-custom-hook";

interface MyComponentProps {
  required: string;
  optional?: number;
}

export const MyComponent = ({ required, optional }: MyComponentProps) => {
  const [state, setState] = useState<string>("");

  return (
    <div className="container">
      {/* Component content */}
    </div>
  );
};
```

### File Naming

- **Components**: PascalCase (`VMCard.tsx`, `UsersList.tsx`)
- **Hooks**: kebab-case with `use-` prefix (`use-theme.tsx`)
- **Services/Utils**: camelCase (`authService.ts`, `localStorage.ts`)
- **Pages**: PascalCase (`Dashboard.tsx`, `Settings.tsx`)

### Styling

- Use Tailwind CSS utility classes
- Use `cn()` helper from `@/lib/utils` for conditional classes
- Extend Shadcn UI components when possible
- Follow responsive design principles (mobile-first)

### Import Order

```typescript
// 1. External dependencies
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Internal absolute imports (@/)
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { proxmoxService } from "@/services/proxmoxService";

// 3. Types
import { VM } from "@/types/vm";

// 4. Relative imports (avoid when possible)
import { helper } from "./helper";
```

### Code Quality

```bash
# Before committing
npm run lint              # Check for linting errors
npm run build             # Ensure code compiles
npm run test:run          # Run all tests
```

## Reporting Bugs

### Before Submitting a Bug Report

1. Check the [existing issues](https://github.com/waive-as/proxmox-manager/issues)
2. Update to the latest version
3. Check the documentation
4. Collect relevant information:
   - Browser and version
   - Operating system
   - Node.js version
   - Proxmox VE version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots or error messages

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. Ubuntu 22.04]
 - Browser: [e.g. Chrome 120]
 - Node.js: [e.g. 20.10.0]
 - Proxmox VE: [e.g. 8.1]

**Additional context**
Any other relevant information.
```

## Suggesting Features

We welcome feature suggestions! Please:

1. **Check existing feature requests** to avoid duplicates
2. **Describe the feature** clearly and concisely
3. **Explain the use case** - why is this needed?
4. **Provide examples** of how it would work
5. **Consider the scope** - does it fit the project's goals?

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Screenshots, mockups, or examples.
```

## Development Resources

- **Architecture Guide**: See [CLAUDE.md](CLAUDE.md) for detailed architecture
- **Deployment Guide**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **API Documentation**: See Proxmox VE API docs
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **React Query**: [TanStack Query](https://tanstack.com/query/latest)

## Questions?

- Open a [GitHub Discussion](https://github.com/waive-as/proxmox-manager/discussions)
- Check existing documentation
- Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Proxmox Manager Portal! 🎉

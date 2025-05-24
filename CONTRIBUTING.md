# Contributing to Hitachi Service Department Web Application

Thank you for your interest in contributing to the Hitachi Service Department Web Application! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git
- Basic knowledge of React, Node.js, and JavaScript

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/hitachi-service-webapp.git
   cd hitachi-service-webapp
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit the .env file with your configuration
   ```

4. **Initialize the database**
   ```bash
   cd backend
   npm run init-db
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

## 📝 How to Contribute

### Reporting Issues

1. **Search existing issues** to avoid duplicates
2. **Use the issue template** when creating new issues
3. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, browser)

### Submitting Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards below
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Frontend tests
   cd frontend
   npm test
   
   # Backend tests (if available)
   cd backend
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide a clear description of changes

## 📋 Coding Standards

### JavaScript/React

- Use **ES6+ syntax**
- Follow **React hooks** patterns
- Use **functional components**
- Implement **proper error handling**
- Add **PropTypes** for component props
- Use **meaningful variable names**

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for JavaScript, double for JSX attributes
- **Semicolons**: Required
- **Line length**: Maximum 100 characters
- **File naming**: camelCase for files, PascalCase for React components

### Example:
```javascript
// Good
const TaskCard = ({ task, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  const handleUpdate = async () => {
    try {
      setLoading(true);
      await onUpdate(task.id);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{task.title}</Typography>
        <Button onClick={handleUpdate} disabled={loading}>
          Update
        </Button>
      </CardContent>
    </Card>
  );
};
```

### Backend Standards

- Use **async/await** for asynchronous operations
- Implement **proper error handling**
- Use **prepared statements** for database queries
- Add **input validation**
- Include **security headers**

### API Design

- Use **RESTful conventions**
- Return **consistent response formats**
- Include **proper HTTP status codes**
- Add **comprehensive error messages**

## 🧪 Testing Guidelines

### Frontend Testing
- Test React components with **React Testing Library**
- Mock API calls in tests
- Test user interactions and edge cases
- Aim for good test coverage

### Backend Testing
- Test API endpoints with **Jest** or **Mocha**
- Mock database operations
- Test authentication middleware
- Test error scenarios

## 📚 Documentation

### Code Documentation
- Add **JSDoc comments** for functions
- Document complex algorithms
- Explain business logic
- Update README for new features

### API Documentation
- Document all endpoints
- Include request/response examples
- Specify required parameters
- Note authentication requirements

## 🔄 Pull Request Process

1. **Ensure CI passes** (linting, tests)
2. **Update documentation** if needed
3. **Add/update tests** for new features
4. **Get code review** from maintainers
5. **Address feedback** promptly
6. **Squash commits** if requested

### PR Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Environment variables documented

## 🎯 Types of Contributions

### Features
- New functionality
- UI/UX improvements
- Performance optimizations
- Third-party integrations

### Bug Fixes
- Logic errors
- UI bugs
- Performance issues
- Security vulnerabilities

### Documentation
- Code comments
- README updates
- API documentation
- Tutorial content

### Refactoring
- Code cleanup
- Architecture improvements
- Dependencies updates
- Performance optimizations

## 🚫 What Not to Contribute

- Breaking changes without discussion
- Features that don't align with project goals
- Code that doesn't follow standards
- Untested changes
- Security vulnerabilities

## 🤝 Code of Conduct

### Our Standards
- **Be respectful** and inclusive
- **Accept constructive criticism** gracefully
- **Focus on the best** for the community
- **Show empathy** towards others

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing private information

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For general questions
- **Email**: For security issues or private matters

## 🎉 Recognition

Contributors will be:
- Added to the contributors list
- Credited in release notes
- Mentioned in project updates

Thank you for contributing to the Hitachi Service Department Web Application! 🙏 
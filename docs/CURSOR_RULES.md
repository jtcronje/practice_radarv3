Code Style and Formatting

Naming Conventions

Use PascalCase for React components (e.g., DoctorAnalysisPage)
Use camelCase for variables and functions (e.g., handleDoctorChange)
Use UPPER_SNAKE_CASE for constants (e.g., DEFAULT_TIME_PERIOD)
Use kebab-case for file names (e.g., doctor-analysis.tsx)


File Structure

One component per file
Group related components in feature directories
Keep utility functions in separate utils directory
Store shared components in a components/shared folder


Component Organization

Imports (React first, then external libraries, then internal modules)
Type definitions (interfaces, types)
Component definition
Helper functions (inside component if only used there)
Export statement


Code Formatting

Use 2 spaces for indentation
Maximum line length: 100 characters
Use semicolons at the end of statements
Use single quotes for strings
Add trailing commas in multi-line objects and arrays



Best Practices

TypeScript

Use explicit type annotations for function parameters and returns
Avoid any type; use unknown when type is truly unknown
Create interfaces for data structures from CSV files
Use proper typing for events and state


React

Use functional components with hooks
Implement proper error boundaries for data loading
Use memoization (useMemo, useCallback) for expensive operations
Keep components focused on a single responsibility


State Management

Use useState for local component state
Use useReducer for complex state logic
Implement context for shared state (filters, selected time periods)
Separate UI state from data state


Performance Optimization

Memoize expensive calculations with useMemo
Memoize callbacks with useCallback when passed to child components
Implement proper dependency arrays in useEffect
Use proper keys in lists to minimize re-renders


CSV Processing

Use consistent error handling for CSV parsing
Implement data validation for parsed CSV content
Use memoization for filtered data results
Handle missing or malformed data gracefully



Project-Specific Guidelines

Dashboard Components

Use consistent layout and styling across all dashboard pages
Implement responsive design for all components
Ensure consistent filter behavior across pages
Format currency values using Intl.NumberFormat


Chart Components

Use consistent color schemes across charts
Provide appropriate tooltips for data points
Ensure charts have proper labels and legends
Handle empty data states gracefully


AI Insight Components

Maintain consistent styling for AI insight panels
Implement clear formatting for metrics highlighted in insights
Handle edge cases where insights cannot be generated
Keep insight text concise and actionable



Git Workflow

Branching

main: production-ready code
develop: integration branch
feature/name: new features (e.g., feature/doctor-analysis)
fix/name: bug fixes (e.g., fix/chart-rendering)


Commit Messages

Use present tense ("Add feature" not "Added feature")
Keep commits focused on single changes
Include brief description of what and why
Example format: "feat(doctor-analysis): add comparison chart"


Pull Requests

Include screenshots for UI changes
List key implementation decisions
Tag relevant team members for review
Ensure all tests pass before requesting review
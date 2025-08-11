# Modulista

Modulista is a client-side web application for managing hierarchical data structures with a custom text format. It provides a dual-view interface (List view for structured editing, Text view for raw text editing) and stores data locally in IndexedDB.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Setup
- Install dependencies: `npm install` -- completes in < 1 second
- No build step required - the application runs directly from source files
- Serve the application: `python3 -m http.server 8000` or any HTTP server
- Access at: `http://localhost:8000`
- **CRITICAL**: Must use HTTP server (not file://) due to ES modules usage

### Testing
- Run tests: `npm test` -- completes in < 2 seconds, runs 31 tests
- Test environment: Jest with fake-indexeddb for browser storage simulation
- All tests use ES modules with NODE_OPTIONS=--experimental-vm-modules

### Development Requirements
- Node.js 18+ (CI uses Node 18)
- Modern browser with ES modules support
- No additional build tools or transpilation needed

## Validation

### Manual Testing Scenarios
After making changes, ALWAYS test these complete workflows:

1. **Basic Item Management**:
   - Start HTTP server and open http://localhost:8000
   - Click the "+" button to add a new item
   - Enter name "TestItem", select type "Texto", enter value "Hello World"
   - Click "Salvar" (Save)
   - Verify item appears in Lista (List) view

2. **Text Format Editing**:
   - In the Texto (Text) view, edit the text area with: `{ TestItem: "Modified" NewItem: "Another Value" }`
   - Click the apply button (save icon)
   - Verify both items appear in Lista (List) view
   - Verify the text view shows the updated format

3. **Data Persistence**:
   - Create items, refresh the browser page
   - Verify all data persists (stored in IndexedDB)

4. **Navigation**:
   - Create a "Lista" type item to create nested structure
   - Navigate into the nested item by clicking on it
   - Verify breadcrumb navigation works
   - Use home button to return to root

### Automated Testing
- Run `npm test` before committing changes
- All 31 tests must pass
- Tests cover: custom parser, item management, database operations

## Application Architecture

### Key Files and Directories
- `src/app.js` - Main application logic, rendering, and event handling
- `src/db.js` - IndexedDB database operations for persistent storage
- `src/custom-parser.js` - Custom text format parser (NOT JSON)
- `src/types/` - Data type definitions (Text, List, Number, Boolean)
- `src/icon-loader.js` - SVG icon loading and caching system
- `src/icons/` - SVG icon files
- `index.html` - Single HTML entry point
- `tests/` - Jest test suite with comprehensive coverage

### Data Types
- **Text** (`text`): String values in quotes: `"Hello World"`
- **Number** (`number`): Numeric values: `42`, `3.14`
- **Boolean** (`boolean`): `@1` for true, `@0` for false
- **List** (`list`): Nested structures: `{ key: "value" nested: { inner: "data" } }`

### Custom Text Format
**CRITICAL**: The text format is NOT JSON. Key differences:
- No commas between items: `{ item1: "value1" item2: "value2" }`
- Booleans use `@1`/`@0`: `{ isActive: @1 }`
- No quoted keys: `{ name: "John" age: 30 }`

## CI/CD and Quality

### GitHub Actions
- Workflow: `.github/workflows/ci.yml`
- Runs on: ubuntu-latest with Node.js 18
- Steps: checkout → setup Node → npm install → npm test
- Triggered on: pull requests to main branch

### Code Quality
- No linting tools configured (no ESLint, Prettier)
- No build or compilation step
- Code style: Modern JavaScript ES modules with consistent formatting

## Common Tasks

### Adding New Features
1. Make changes to source files in `src/`
2. Add tests in `tests/` for new functionality
3. Run `npm test` to verify all tests pass
4. Test manually via HTTP server
5. Always validate the complete user workflow scenarios

### Debugging
- Use browser dev tools for frontend debugging
- Check browser console for errors
- IndexedDB data visible in browser Application/Storage tab
- Server logs show HTTP requests when using python3 -m http.server

### File Structure Reference
```
.
├── README.md
├── index.html                 # Entry point
├── package.json              # Dependencies and scripts
├── jest.config.js            # Test configuration
├── tailwind.config.js        # CSS framework config
├── src/
│   ├── app.js               # Main application
│   ├── db.js                # Database operations
│   ├── custom-parser.js     # Text format parser
│   ├── icon-loader.js       # Icon system
│   ├── types/               # Data type definitions
│   └── icons/               # SVG icon files
├── tests/                   # Jest test suite
└── .github/
    └── workflows/ci.yml     # GitHub Actions
```

## Quick Reference Commands

Essential commands for working with Modulista:

```bash
# Setup (< 1 second)
npm install

# Test (< 2 seconds)
npm test

# Serve application
python3 -m http.server 8000

# Check available npm scripts
npm run
```

Example custom text format:
```
{
  user: {
    name: "João"
    age: 30
    active: @1
  }
  settings: {
    theme: "dark"
    notifications: @0
  }
}
```

Example of all data types:
```
{ TextItem: "Hello World" NumberItem: 42 BooleanTrue: @1 BooleanFalse: @0 ListItem: { nested: "value" } }
```
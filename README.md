# Modulista

Modulista is a React-based client-side web application for managing hierarchical data structures with a custom text format. It provides a dual-view interface (List view for structured editing, Text view for raw text editing) and stores data locally in IndexedDB.

## Features

- **React-based Architecture**: Modern React components with hooks and functional programming
- **Dual-view Interface**: Switch between structured List view and raw Text view
- **Custom Text Format**: Unique non-JSON format for data representation
- **Local Storage**: IndexedDB for persistent client-side data storage
- **Responsive Design**: Adaptive layout for landscape (side-by-side) and portrait (tabs) modes
- **Drag & Drop**: Reorder items in List view
- **CRUD Operations**: Create, Read, Update, Delete items with full hierarchy support
- **Dark Mode**: Automatic theme switching based on system preference

## Development

### Prerequisites
- Node.js 18+
- Modern browser with ES modules support

### Setup and Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

### Development Server
The development server runs on `http://localhost:8000` and includes:
- Hot module replacement
- React DevTools integration
- Vite development optimizations

### Project Structure

```
src/
├── App.jsx                 # Main React application component
├── main.jsx               # React application entry point
├── components/             # React components
│   ├── ListView.jsx       # List view with dual/tab layout
│   ├── ItemDetailView.jsx # Item editing interface
│   ├── ListContent.jsx    # List content with drag & drop
│   ├── TextContent.jsx    # Text editor with custom format
│   └── Breadcrumb.jsx     # Navigation breadcrumb
├── app-vanilla.js         # Legacy vanilla JS functions (preserved)
├── db.js                  # IndexedDB operations
├── custom-parser.js       # Custom text format parser
├── types/                 # Data type definitions
│   ├── TextType.js       # Text data type
│   ├── NumberType.js     # Numeric data type
│   ├── BooleanType.js    # Boolean data type
│   └── ListType.js       # Nested list data type
├── icon-loader.js         # SVG icon loading system
└── icons/                 # SVG icon files
```

## Data Types

- **Text** (`text`): String values in quotes: `"Hello World"`
- **Number** (`number`): Numeric values: `42`, `3.14`
- **Boolean** (`boolean`): `@1` for true, `@0` for false
- **List** (`list`): Nested structures: `{ key: "value" nested: { inner: "data" } }`

## Custom Text Format

**Important**: The text format is NOT JSON. Key differences:
- No commas between items: `{ item1: "value1" item2: "value2" }`
- Booleans use `@1`/`@0`: `{ isActive: @1 }`
- No quoted keys: `{ name: "John" age: 30 }`

Example:
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

## Architecture Notes

### React Migration
This application was recently migrated from vanilla JavaScript to React while preserving:
- All existing functionality and user interface
- Complete data persistence and custom parsing logic
- Comprehensive test suite (31 tests)
- Build and development processes

### Technology Stack
- **Frontend**: React 18 with functional components and hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS via CDN
- **Storage**: IndexedDB with custom wrapper
- **Testing**: Jest with jsdom environment
- **Module System**: ES modules throughout

### Legacy Compatibility
The original vanilla JavaScript implementation is preserved in `src/app-vanilla.js` and continues to provide core business logic functions that are imported by React components, ensuring a smooth transition and maintaining all existing functionality.

## Testing

Run the test suite with:
```bash
npm test
```

The test suite includes:
- Custom parser validation (10 tests)
- Item management operations (8 tests)
- Type change scenarios (13 tests)
- Database integration tests

All tests use ES modules and run in a simulated browser environment with fake IndexedDB.
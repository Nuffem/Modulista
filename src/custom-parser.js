/**
 * This file contains the logic for parsing and stringifying the custom text format.
 */
import { getItems } from './db.js';

class Parser {
  constructor(text) {
    this.text = text;
    this.pos = 0;
  }

  parse() {
    this.skipWhitespace();
    const result = this.parseList();
    this.skipWhitespace();
    if (this.pos < this.text.length) {
      this.throwError("Unexpected token");
    }
    return result;
  }

  parseList() {
    this.consume('{');
    const list = {};
    this.skipWhitespace();
    while (this.peek() !== '}') {
      const [name, value] = this.parseItem();
      if (list.hasOwnProperty(name)) {
        this.throwError(`Duplicate key in list: ${name}`);
      }
      list[name] = value;
      this.skipWhitespace();
    }
    this.consume('}');
    return list;
  }

  parseItem() {
    const name = this.parseName();
    this.skipWhitespace();
    this.consume(':');
    this.skipWhitespace();
    const value = this.parseValue();
    return [name, value];
  }

  parseName() {
    const match = this.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (!match) {
      this.throwError("Invalid name");
    }
    return match[0];
  }

  parseValue() {
    const char = this.peek();
    if (char === '"') {
      return this.parseText();
    } else if (char === '@') {
      return this.parseBoolean();
    } else if (char === '{') {
      return this.parseList();
    } else if (char === '-' || (char >= '0' && char <= '9')) {
      return this.parseNumber();
    } else {
      this.throwError("Invalid value");
    }
  }

  parseText() {
    this.consume('"');
    let text = '';
    while (this.peek() !== '"') {
      if (this.peek() === '\\') {
        this.consume('\\');
        if (this.peek() === 'x') {
          this.consume('x');
          const hex = this.text.substring(this.pos, this.pos + 2);
          if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
            this.throwError("Invalid hex escape sequence");
          }
          text += String.fromCharCode(parseInt(hex, 16));
          this.pos += 2;
        } else {
          this.throwError("Invalid escape sequence");
        }
      } else {
        text += this.peek();
        this.pos++;
      }
    }
    this.consume('"');
    return text;
  }

  parseNumber() {
    const match = this.match(/^-?\d+(\.\d+)?/);
    if (!match) {
      this.throwError("Invalid number");
    }
    return parseFloat(match[0]);
  }

  parseBoolean() {
    this.consume('@');
    const val = this.peek();
    if (val === '1') {
      this.pos++;
      return true;
    }
    if (val === '0') {
      this.pos++;
      return false;
    }
    this.throwError("Invalid boolean");
  }

  peek() {
    if (this.pos >= this.text.length) {
      this.throwError("Unexpected end of input");
    }
    return this.text[this.pos];
  }

  consume(char) {
    if (this.peek() !== char) {
      this.throwError(`Expected '${char}'`);
    }
    this.pos++;
  }

  match(regex) {
    const sub = this.text.substring(this.pos);
    const match = sub.match(regex);
    if (match) {
      this.pos += match[0].length;
      return match;
    }
    return null;
  }

  skipWhitespace() {
    const ws = /^\s*/;
    const match = this.text.substring(this.pos).match(ws);
    if (match) {
      this.pos += match[0].length;
    }
  }

  throwError(message) {
    // Find line and column for error reporting
    let line = 1;
    let col = 1;
    for (let i = 0; i < this.pos; i++) {
        if (this.text[i] === '\n') {
            line++;
            col = 1;
        } else {
            col++;
        }
    }
    throw new Error(`${message} at line ${line}, col ${col}`);
  }
}

/**
 * Parses a string in the custom format and returns a JavaScript object.
 * @param {string} text - The string to parse.
 * @returns {object} The parsed object.
 */
export function parse(text) {
  const parser = new Parser(text);
  return parser.parse();
}

/**
 * Converts an array of items into a string in the custom format.
 * This function recursively fetches sub-items for lists to create a nested structure.
 * @param {Array<object>} items - The initial array of items to stringify.
 * @param {string} path - The path of the initial items.
 * @returns {Promise<string>} The string in the custom format.
 */
export async function stringify(items, path) {
  const content = await stringifyItems(items, 1, path);
  if (content) {
    return `{\n${content}\n}`;
  }
  return '{}';
}

async function stringifyItems(items, indentLevel, currentPath) {
  const indent = '  '.repeat(indentLevel);
  const stringifiedPromises = items.map(async (item) => {
    const valueStr = await stringifyValue(item, indentLevel, currentPath);
    return `${indent}${item.name}: ${valueStr}`;
  });
  const stringified = await Promise.all(stringifiedPromises);
  return stringified.join('\n');
}

function escapeText(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = text.charCodeAt(i);
    if (char === '"' || char === '\\') {
      result += `\\x${charCode.toString(16).padStart(2, '0')}`;
    } else if (charCode < 32 || charCode > 126) {
      result += `\\x${charCode.toString(16).padStart(2, '0')}`;
    } else {
      result += char;
    }
  }
  return result;
}

async function stringifyValue(item, indentLevel, currentPath) {
  const indent = '  '.repeat(indentLevel);
  switch (item.type) {
    case 'text':
      return `"${escapeText(item.value)}"`;
    case 'number':
      return item.value;
    case 'boolean':
      return item.value ? '@1' : '@0';
    case 'list':
      const listPath = `${currentPath}${item.name}/`;
      try {
        const subItems = await getItems(listPath);
        if (subItems.length > 0) {
          const content = await stringifyItems(subItems, indentLevel + 1, listPath);
          return `{\n${content}\n${indent}}`;
        }
      } catch (error) {
        console.error(`Failed to get items for path: ${listPath}`, error);
      }
      return '{}';
    default:
      return '""'; // Should not happen with valid data
  }
}

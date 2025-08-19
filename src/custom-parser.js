/**
 * This file contains the logic for parsing and stringifying the custom text format.
 */
import { getItems } from './db.js';
import { itemTypes } from './types.js';

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
      return this.parseNumericExpression();
    } else if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_') {
      return this.parseReference();
    } else {
      this.throwError("Invalid value");
    }
  }

  parseReference() {
    const match = this.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (!match) {
      this.throwError("Invalid reference");
    }
    return { type: 'reference', name: match[0] };
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

  _parseSingleNumber() {
    const match = this.match(/^-?\d+(\.\d+)?/);
    if (!match) {
      this.throwError("Invalid number");
    }
    return parseFloat(match[0]);
  }

  parseNumericExpression() {
    return this._parseSingleNumber();
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

export function stringify(items, path, indentLevel = 1) {
  if (items.length === 0) {
    return '{}';
  }
  const parts = stringifyItems(items, indentLevel, path);
  return {
    prefix: '{\n',
    suffix: `\n${'  '.repeat(indentLevel - 1)}}`,
    parts: parts,
  };
}

function stringifyItems(items, indentLevel, currentPath) {
  const parts = [];
  const indent = '  '.repeat(indentLevel);
  for (const item of items) {
    const value = stringifyValue(item, indentLevel, currentPath);
    parts.push(`${indent}${item.name}: `);
    parts.push(value);
    parts.push('\n');
  }
  if (parts.length > 0) {
    parts.pop();
  }
  return parts;
}

export async function executePlan(plan, getItems) {
  if (typeof plan === 'string') {
    return plan;
  }

  let result = plan.prefix;
  for (const part of plan.parts) {
    if (typeof part === 'string') {
      result += part;
    } else if (part && typeof part === 'object' && part.type === 'LIST') {
      const subItems = await getItems(part.path);
      const subPlan = stringify(subItems, part.path, part.indentLevel);
      result += await executePlan(subPlan, getItems);
    } else if (part && typeof part === 'object' && part.type === 'EXPRESSION') {
      // Handle mathematical expression formatting
      const childItems = await getItems(part.path);
      const numericValues = childItems
        .filter(child => child.type === 'number' && typeof child.value === 'number')
        .map(child => child.value);
      
      if (numericValues.length === 0) {
        result += '';
      } else if (numericValues.length === 1) {
        result += numericValues[0];
      } else {
        const expression = numericValues.join(` ${part.operator} `);
        result += expression;
      }
    } else {
      // Handle primitive values (numbers, booleans, etc.)
      result += String(part);
    }
  }
  result += plan.suffix;
  return result;
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

function stringifyValue(item, indentLevel, currentPath) {
    const type = itemTypes[item.type];
    
    // Handle expression types with mathematical operators
    if (type && type.isExpression) {
        if (item.type === 'soma') {
            const listPath = `${currentPath}${item.name}/`;
            return { type: 'EXPRESSION', operator: '+', path: listPath };
        } else if (item.type === 'subtracao') {
            const listPath = `${currentPath}${item.name}/`;
            return { type: 'EXPRESSION', operator: '-', path: listPath };
        } else {
            // Fallback for other expression types
            const listPath = `${currentPath}${item.name}/`;
            return { type: 'LIST', path: listPath, indentLevel: indentLevel + 1 };
        }
    }
    
    if (item.type === 'list') {
        const listPath = `${currentPath}${item.name}/`;
        return { type: 'LIST', path: listPath, indentLevel: indentLevel + 1 };
    }

    if (item.type === 'text') {
        return `"${escapeText(item.value)}"`;
    }

    if (item.type === 'reference') {
        return item.value; // Return the reference name without quotes
    }

    if (!type) {
        return '""';
    }

    return type.formatValueForDisplay(item);
}

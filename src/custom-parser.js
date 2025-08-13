/**
 * This file contains the logic for parsing and stringifying the custom text format.
 */

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
    const list = [];
    this.skipWhitespace();
    while (this.peek() !== '}') {
      const item = this.parseItem();
      list.push(item);
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
    const [valor, tipo] = this.parseValue();
    return { nome: name, tipo, valor };
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
      return [this.parseText(), 'Texto'];
    } else if (char === '@') {
      return [this.parseBoolean(), 'Booleano'];
    } else if (char === '{') {
      return [this.parseList(), 'Lista'];
    } else if (char === '-' || (char >= '0' && char <= '9')) {
      return [this.parseNumericExpression(), 'Numero'];
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

async function stringifyValue(item, indentLevel, currentPath, getItems) {
  switch (item.tipo) {
    case 'Texto':
      return `"${escapeText(item.valor)}"`;
    case 'Numero':
      if (typeof item.valor !== 'number' || isNaN(item.valor)) {
        return 0;
      }
      return item.valor;
    case 'Booleano':
      return item.valor ? '@1' : '@0';
    case 'Lista':
      const listPath = `${currentPath}${item.nome}/`;
      const subItems = await getItems(listPath);
      return await stringify(subItems, listPath, getItems, indentLevel + 1);
    default:
      return '""';
  }
}

export async function stringify(items, path, getItems, indentLevel = 1) {
  if (!items || items.length === 0) {
    return '{}';
  }

  const indent = '  '.repeat(indentLevel);
  const closingIndent = '  '.repeat(indentLevel - 1);
  let content = '';

  for (const item of items) {
    const value = await stringifyValue(item, indentLevel, path, getItems);
    content += `${indent}${item.nome}: ${value}\n`;
  }

  return `{\n${content}${closingIndent}}`;
}

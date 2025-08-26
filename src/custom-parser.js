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
    while (this.safePeek() !== '}' && this.safePeek() !== null) {
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
    } else if (char === '/' && this.pos + 1 < this.text.length && this.text[this.pos + 1] === '/') {
      return this.parseComment();
    } else if (char === '-' || (char >= '0' && char <= '9')) {
      // For language 0 compatibility, only treat standalone 0/1 as booleans
      // when they are not followed by other digits and not in contexts where numbers are expected
      if ((char === '0' || char === '1') && this.pos + 1 < this.text.length) {
        const nextChar = this.text[this.pos + 1];
        // Only treat as boolean if followed by whitespace or structural characters, not digits
        if (/[\s}]/.test(nextChar)) {
          // This could be a boolean, but let's be conservative and parse as number
          // The user can explicitly use @1/@0 if they want booleans
          return this.parseNumericExpression();
        }
      }
      return this.parseNumericExpression();
    } else if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_') {
      return this.parseReference();
    } else {
      this.throwError("Invalid value");
    }
  }

  parseReference() {
    // Look ahead to see if this might be a conditional expression or function
    const startPos = this.pos;
    
    // Read until we find a delimiter or the end of the expression
    let tempPos = this.pos;
    let expression = '';
    let depth = 0;
    
    while (tempPos < this.text.length) {
      const char = this.text[tempPos];
      
      // Track nested structures
      if (char === '{') depth++;
      else if (char === '}') {
        if (depth === 0) break; // We've reached the end of this value
        depth--;
      }
      
      // Check for key-value separators when not in nested structure
      if (depth === 0) {
        // Stop if we hit a newline or the start of next key
        if (char === '\n' || char === '\r') {
          // Look ahead for the next non-whitespace character
          let nextPos = tempPos + 1;
          while (nextPos < this.text.length && /\s/.test(this.text[nextPos])) {
            nextPos++;
          }
          if (nextPos < this.text.length && /[a-zA-Z_]/.test(this.text[nextPos])) {
            break; // This looks like the start of a new key
          }
        }
        
        // Stop if we hit a closing brace
        if (char === '}') break;
      }
      
      expression += char;
      tempPos++;
    }
    
    // Check if this contains a function arrow (=>)
    const arrowIndex = expression.indexOf('=>');
    if (arrowIndex !== -1) {
      // This is a function expression
      this.pos = startPos;
      return this.parseFunction();
    }
    
    // Check if this contains a conditional operator (?)
    const questionMarkIndex = expression.indexOf('?');
    const colonIndex = expression.indexOf(':');
    
    if (questionMarkIndex !== -1 && colonIndex !== -1 && questionMarkIndex < colonIndex) {
      // This is a conditional expression
      this.pos = startPos;
      return this.parseConditional();
    }
    
    // Otherwise, parse as a simple reference
    const match = this.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (!match) {
      this.throwError("Invalid reference");
    }
    return { type: 'reference', name: match[0] };
  }

  parseConditional() {
    // Check if this is the new object format
    this.skipWhitespace();
    if (this.pos < this.text.length && this.peek() === '{') {
      // Parse as object: { condition: "...", trueValue: "...", falseValue: "..." }
      return this.parseConditionalObject();
    }
    
    // Parse legacy format: everything until we reach a structural character or end
    let expression = '';
    let depth = 0;
    
    while (this.pos < this.text.length) {
      const char = this.peek();
      
      // Track nested structures
      if (char === '{') depth++;
      else if (char === '}') {
        if (depth === 0) break; // We've reached the end of this value
        depth--;
      }
      
      // Stop at newline if we're not in a nested structure
      if ((char === '\n' || char === '\r') && depth === 0) {
        break;
      }
      
      expression += char;
      this.pos++;
    }
    
    expression = expression.trim();
    
    // Validate the conditional expression format
    const questionIndex = expression.indexOf('?');
    const colonIndex = expression.lastIndexOf(':');
    
    if (questionIndex === -1 || colonIndex === -1 || questionIndex >= colonIndex) {
      this.throwError(`Invalid conditional expression: ${expression}`);
    }
    
    return { type: 'condicional', value: expression };
  }

  parseFunction() {
    // Parse function syntax: param => expression
    let expression = '';
    let depth = 0;
    
    while (this.pos < this.text.length) {
      const char = this.peek();
      
      // Track nested structures
      if (char === '{') depth++;
      else if (char === '}') {
        if (depth === 0) break; // We've reached the end of this value
        depth--;
      }
      
      // Check for key-value separators when not in nested structure
      if (depth === 0) {
        // Stop if we hit a newline or the start of next key
        if (char === '\n' || char === '\r') {
          // Look ahead for the next non-whitespace character
          let nextPos = this.pos + 1;
          while (nextPos < this.text.length && /\s/.test(this.text[nextPos])) {
            nextPos++;
          }
          if (nextPos < this.text.length && /[a-zA-Z_]/.test(this.text[nextPos])) {
            break; // This looks like the start of a new key
          }
        }
        
        // Stop if we hit whitespace followed by what looks like a new key
        if (/\s/.test(char)) {
          let nextPos = this.pos + 1;
          while (nextPos < this.text.length && /\s/.test(this.text[nextPos])) {
            nextPos++;
          }
          if (nextPos < this.text.length && /[a-zA-Z_]/.test(this.text[nextPos])) {
            // Look further ahead to see if there's a colon (indicating a key)
            let colonPos = nextPos;
            while (colonPos < this.text.length && /[a-zA-Z0-9_]/.test(this.text[colonPos])) {
              colonPos++;
            }
            while (colonPos < this.text.length && /\s/.test(this.text[colonPos])) {
              colonPos++;
            }
            if (colonPos < this.text.length && this.text[colonPos] === ':') {
              break; // This is the start of a new key:value pair
            }
          }
        }
        
        // Stop if we hit a closing brace
        if (char === '}') break;
      }
      
      expression += char;
      this.pos++;
    }
    
    // Parse the function syntax
    const arrowIndex = expression.indexOf('=>');
    if (arrowIndex === -1) {
      this.throwError("Invalid function syntax, expected '=>'");
    }
    
    const param = expression.substring(0, arrowIndex).trim();
    const funcExpression = expression.substring(arrowIndex + 2).trim();
    
    if (!param) {
      this.throwError("Function parameter cannot be empty");
    }
    
    if (!funcExpression) {
      this.throwError("Function expression cannot be empty");
    }
    
    return { 
      type: 'function', 
      value: { 
        param: param, 
        expression: funcExpression 
      } 
    };
  }

  parseComment() {
    // Consume the '//' 
    this.consume('/');
    this.consume('/');
    
    // Skip any immediate whitespace after //
    while (this.pos < this.text.length && this.text[this.pos] === ' ') {
      this.pos++;
    }
    
    // Read until end of line, closing brace, start of new key, or end of input
    let comment = '';
    while (this.pos < this.text.length) {
      const char = this.text[this.pos];
      
      // Stop at newline or closing brace
      if (char === '\n' || char === '\r' || char === '}') {
        break;
      }
      
      // Stop if we hit whitespace followed by what looks like a new key
      if (/\s/.test(char)) {
        let nextPos = this.pos + 1;
        while (nextPos < this.text.length && /\s/.test(this.text[nextPos])) {
          nextPos++;
        }
        if (nextPos < this.text.length && /[a-zA-Z_]/.test(this.text[nextPos])) {
          // Look further ahead to see if there's a colon (indicating a key)
          let colonPos = nextPos;
          while (colonPos < this.text.length && /[a-zA-Z0-9_]/.test(this.text[colonPos])) {
            colonPos++;
          }
          while (colonPos < this.text.length && /\s/.test(this.text[colonPos])) {
            colonPos++;
          }
          if (colonPos < this.text.length && this.text[colonPos] === ':') {
            break; // This is the start of a new key:value pair
          }
        }
      }
      
      comment += char;
      this.pos++;
    }
    
    return { 
      type: 'comment', 
      value: comment.trim()
    };
  }

  parseConditionalObject() {
    this.consume('{');
    this.skipWhitespace();
    
    const conditionalObj = {
      condition: '',
      trueValue: '',
      falseValue: ''
    };
    
    while (this.pos < this.text.length && this.peek() !== '}') {
      this.skipWhitespace();
      
      // Parse key
      const key = this.parseIdentifier();
      this.skipWhitespace();
      this.consume(':');
      this.skipWhitespace();
      
      // Parse value (can be string, number, boolean, or identifier)
      let value = '';
      if (this.peek() === '"') {
        const parsed = this.parseText();
        value = parsed.value;
      } else if (this.peek() === '@') {
        const parsed = this.parseBoolean();
        value = parsed ? '@1' : '@0';
      } else if (/\d/.test(this.peek()) || this.peek() === '-') {
        const parsed = this.parseNumber();
        value = String(parsed);
      } else {
        // Parse as identifier/reference
        value = this.parseIdentifier();
      }
      
      if (key === 'condition') {
        conditionalObj.condition = value;
      } else if (key === 'trueValue') {
        conditionalObj.trueValue = value;
      } else if (key === 'falseValue') {
        conditionalObj.falseValue = value;
      }
      
      this.skipWhitespace();
      if (this.pos < this.text.length && this.peek() !== '}') {
        // Optional comma or whitespace between fields
        if (this.peek() === ',') {
          this.pos++;
        }
      }
    }
    
    this.consume('}');
    
    return { type: 'condicional', value: conditionalObj };
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
    // Support both @1/@0 (old format) and 1/0 (language 0 format)
    if (this.peek() === '@') {
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
    } else {
      // Language 0 format: just 1 or 0
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
  }

  peek() {
    if (this.pos >= this.text.length) {
      this.throwError("Unexpected end of input");
    }
    return this.text[this.pos];
  }

  safePeek() {
    if (this.pos >= this.text.length) {
      return null;
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
        } else if (item.type === 'condicional') {
            // For conditional expressions, return the structured format
            if (typeof item.value === 'object' && item.value.condition !== undefined) {
                return `{ condition: "${escapeText(item.value.condition || '')}" trueValue: "${escapeText(item.value.trueValue || '')}" falseValue: "${escapeText(item.value.falseValue || '')}" }`;
            }
            // Handle legacy format
            return item.value || '';
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

    if (item.type === 'function') {
        if (typeof item.value === 'object' && item.value.param && item.value.expression) {
            return `${item.value.param} => ${item.value.expression}`;
        }
        return item.value || '';
    }

    if (item.type === 'comment') {
        return `// ${item.value || ''}`;
    }

    if (!type) {
        return '""';
    }

    return type.formatValueForDisplay(item);
}

const fs = require('fs');

const input = fs.readFileSync('./Lexical/inputTest.txt', 'utf8');

const symbolTable = [];
const tokens = [];

const splitedCode = splitCode(input);

for (const value of splitedCode) {
  const tokenInfo = createToken(value);

  const formattedValue = {
    id: symbolTable.length + 1,
    lexema: value,
    token: tokenInfo.token,
    valor: tokenInfo.token === "NUMBER" ? Number(value) : null
  };

  // Verifica se é um token inválido/desconhecido
  if (tokenInfo.token === 'UNKNOWN') {
    console.error(`Erro léxico: Token desconhecido '${value}'`);
    break; 
  }

  const lexemaAlreadyExists = symbolTable.some(entry => entry.lexema === value);

  if (!lexemaAlreadyExists) {
    symbolTable.push(formattedValue);
    tokens.push(`<${formattedValue.token}, ${formattedValue.id}>`);
  } else {
    const existingEntry = symbolTable.find(entry => entry.lexema === value);
    tokens.push(`<${existingEntry.token}, ${existingEntry.id}>`);
  }
}

function splitCode(input) {
  // Verificação de comentários não fechados
  if ((input.match(/\/\*/g) || []).length !== (input.match(/\*\//g) || []).length) {
    console.error('Erro: Comentário não fechado');
  }

  // Regex original melhorada
  const regex = /(\d+\.?\d*|\w+|[!=<>]=?|[+\-*/(){}\[\].,;:&|]|\/\*|\*\/|\/\/|\S)/g;
  return input.match(regex) || [];
}

function createToken(value) {
  // Verificação de caracteres inválidos primeiro
  if (/[\x00-\x1F]/.test(value)) {
    return { token: 'UNKNOWN', error: `Caractere de controle inválido (ASCII ${value.charCodeAt(0)})` };
  }

  // Verificação de números mal formados
  if (/^\d+\.\d+\./.test(value)) {
    return { token: 'UNKNOWN', error: 'Número com ponto decimal duplicado' };
  }

  const type = findType(value);

  const symbols = {
    '=': 'GET', '+': 'PLUS', '-': 'MINUS', '*': 'TIMES', '/': 'DIVIDE',
    '{': 'KEY_OPEN', '}': 'KEY_CLOSE', '(': 'PAR_OPENING', ')': 'PAR_CLOSE',
    ';': 'SEMICOLON', ',': 'COMA', '>': 'GREATER', '<': 'LESS', '!': 'NOT',
    '&': 'AND', '|': 'OR', "'": 'SINGLE_QUOTES', '==': 'EQUALS',
    '===': 'STRICTLY_EQUALS', '!=': 'DIFFERENT', '!==': 'STRICTLY_DIFFERENT',
    '"': 'DOUBLE_QUOTES', '%': 'PERCENT', '.': 'DOT'
  };

  switch (type) {
    case 'NUMBER':
      // Verifica se é um número válido (não contém letras)
      return /^\d+$/.test(value) ? { token: 'NUMBER' } : { token: 'UNKNOWN' };
    case 'SYMBOL':
      return symbols[value] ? { token: 'SYMBOL_' + symbols[value] } : { token: 'UNKNOWN' };
    case 'RESERVED_WORD':
      return { token: 'KW_' + value.toUpperCase() };
    case 'IDENTIFIER':
      // Verifica se é um identificador válido
      return /^[a-zA-Z_]\w*$/.test(value) ? { token: 'ID' } : { token: 'UNKNOWN' };
    default:
      return { token: 'UNKNOWN' };
  }
}

function findType(value) {
  // Verifica se é número (incluindo casos inválidos como 123a)
  if (/^\d/.test(value)) {
    return 'NUMBER';
  }

  // Verifica se é símbolo
  if (/^[^\w\s]+$/.test(value)) {
    return 'SYMBOL';
  }

  // Verifica se é palavra reservada
  if (checkIfIsReservedWord(value)) {
    return 'RESERVED_WORD';
  }

  // Assume que é um identificador
  return 'IDENTIFIER';
}

function checkIfIsReservedWord(word) {
  const reservedWords = [
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
    'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
    'for', 'if', 'goto', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
    'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
    'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while',
    'System', 'out', 'println', 'args', 'String'
  ];

  return reservedWords.includes(word);
}

// console.log('--> Lexemas');
// console.log(splitedCode.join(' | '));

// console.log('\n--> Tabela de símbolos');
// console.log(symbolTable);

// console.log('\n--> Código Tokenizado');
// console.log(tokens.join(' '));

module.exports = { symbolTable, tokens }
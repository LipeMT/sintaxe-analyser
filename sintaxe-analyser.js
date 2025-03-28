let { symbolTable, tokens } = require('./Lexical/lexical-analyser')
tokens = tokens.map(token => token.replace(`<`, ``).replace(`>`, ``).split(`,`))

const arr = []

for (const item of tokens) {
  let [token, id] = item
  id = id.trim()
  const row = symbolTable.find((element) => {
    return element.id == id
  })
  let lexema = row.lexema
  if (row.token === 'NUMBER' || row.token === 'ID') {
    lexema = row.lexema.split('')
    arr.push(...lexema)
  } else {
    arr.push(lexema)
  }
}
// console.log(arr)


const fs = require('fs');
const {
  processProductions,
  calculateProductionFirst,
  displayParsingTable
} = require('./utils');

const codeReader = (code) => {
  let productions = {};
  code = code.split('\r\n');
  code.map(production => {
    if (production.trim() === '') return;
    production = production.split('→').map(element => element.trim());
    productions[production[0]] = production[1].split('|').map(element => element.trim());
  });
  return productions;
};

const code = fs.readFileSync('./input.txt', 'utf8');
const readedCode = codeReader(code);

const findFirst = (code, isTerminal) => {
  const firsts = {};
  const roles = processProductions(code);

  for (const nonTerminal in roles) {
    firsts[nonTerminal] = new Set();
  }

  let changed;
  do {
    changed = false;

    for (const nonTerminal in roles) {
      const productions = roles[nonTerminal];

      for (const production of productions) {
        for (let i = 0; i < production.length; i++) {
          const symbol = production[i];

          if (isTerminal(symbol)) {
            const beforeSize = firsts[nonTerminal].size;
            firsts[nonTerminal].add(symbol);
            if (firsts[nonTerminal].size > beforeSize) {
              changed = true;
            }
            break;
          } else {
            const beforeSize = firsts[nonTerminal].size;
            firsts[nonTerminal] = new Set([...firsts[nonTerminal], ...firsts[symbol]]);
            if (firsts[nonTerminal].size > beforeSize) {
              changed = true;
            }

            if (!firsts[symbol].has('ϵ')) {
              break;
            }

            if (i === production.length - 1) {
              firsts[nonTerminal].add('ϵ');
            }
          }
        }
      }
    }
  } while (changed);

  for (const nonTerminal in firsts) {
    firsts[nonTerminal] = Array.from(firsts[nonTerminal]);
  }

  return firsts;
};

const findFollow = (code, firsts, isTerminal) => {
  const follows = {};
  const roles = processProductions(code);

  for (const nonTerminal in roles) {
    follows[nonTerminal] = new Set();
  }

  const startSymbol = Object.keys(roles)[0];
  follows[startSymbol].add('$');

  let changed;
  do {
    changed = false;

    for (const nonTerminal in roles) {
      for (const production of roles[nonTerminal]) {
        for (let i = 0; i < production.length; i++) {
          const symbol = production[i];

          if (!isTerminal(symbol)) {
            let allNextCanBeEmpty = true;
            let j = i + 1;

            while (j < production.length && allNextCanBeEmpty) {
              const nextSymbol = production[j];

              if (isTerminal(nextSymbol)) {
                const beforeSize = follows[symbol].size;
                follows[symbol].add(nextSymbol);
                if (follows[symbol].size > beforeSize) changed = true;
                allNextCanBeEmpty = false;
              } else {
                const beforeSize = follows[symbol].size;
                for (const terminal of firsts[nextSymbol]) {
                  if (terminal !== 'ϵ') follows[symbol].add(terminal);
                }
                if (follows[symbol].size > beforeSize) changed = true;

                if (!firsts[nextSymbol].includes('ϵ')) {
                  allNextCanBeEmpty = false;
                }
              }
              j++;
            }

            if (allNextCanBeEmpty) {
              const beforeSize = follows[symbol].size;
              for (const terminal of follows[nonTerminal]) {
                follows[symbol].add(terminal);
              }
              if (follows[symbol].size > beforeSize) changed = true;
            }
          }
        }
      }
    }
  } while (changed);

  const result = {};
  for (const nonTerminal in follows) {
    result[nonTerminal] = Array.from(follows[nonTerminal]);
  }
  return result;
};

const buildParsingTable = (code, firsts, follows, isTerminal) => {
  const roles = processProductions(code);
  const table = {};

  for (const nonTerminal in roles) {
    table[nonTerminal] = {};
  }

  for (const nonTerminal in roles) {
    for (const production of roles[nonTerminal]) {
      const productionFirst = calculateProductionFirst(production, firsts, isTerminal);

      for (const terminal of productionFirst) {
        if (terminal !== 'ϵ') {
          if (table[nonTerminal][terminal]) {
            console.warn(`Conflito na tabela M[${nonTerminal}][${terminal}]`);
          }
          table[nonTerminal][terminal] = production;
        }
      }

      if (productionFirst.includes('ϵ')) {
        for (const terminal of follows[nonTerminal]) {
          if (table[nonTerminal][terminal]) {
            console.warn(`Conflito na tabela M[${nonTerminal}][${terminal}]`);
          }
          table[nonTerminal][terminal] = production;
        }
      }
    }
  }

  return table;
};

const isTerminal = (value) => {
  const nonTerminals = Object.keys(readedCode);
  return !nonTerminals.includes(value);
};

function parseInput(tokens, parsingTable, startSymbol) {
  const stack = ['$', startSymbol];
  const input = [...tokens, '$'];
  const output = [];

  let i = 0;

  while (stack.length > 0) {
    const top = stack.pop();
    const currentToken = input[i];

    if (top === currentToken) {
      output.push(`Match: ${top}`);
      i++;
    } else if (parsingTable[top]) {
      const production = parsingTable[top][currentToken];
      if (!production) {
        throw new Error(`Erro de sintaxe: não há produção para [${top}][${currentToken}]`);
      }
      
      output.push(`${top} → ${production.join('')}`);
      if (production != 'ϵ' && production != 'ϵ') {
        for (let j = production.length - 1; j >= 0; j--) {
          stack.push(production[j]);
        }
      }
    } else {
      throw new Error(`Erro de sintaxe: esperado '${top}', mas encontrado '${currentToken}'`);
    }
  }

  if (input[i] !== '$') {
    throw new Error(`Erro: entrada não consumida completamente. Restante: ${input.slice(i).join(' ')}`);
  }

  return output;
}

const firsts = findFirst(readedCode, isTerminal);
const follows = findFollow(readedCode, firsts, isTerminal);
const parsingTable = buildParsingTable(readedCode, firsts, follows, isTerminal);


const input = [...arr, `$`];

try {
  const result = parseInput(input, parsingTable, 'S');
  console.log('\nANÁLISE DESCENDENTE:\n');
  result.forEach(step => console.log(step));
} catch (e) {
  console.error(e.message);
}

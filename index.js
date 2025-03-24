const fs = require('fs');
const code = fs.readFileSync('./input.txt', 'utf8');

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



const findFirst = (code) => {
  const firsts = {}; // Objeto para armazenar os conjuntos First
  const roles = unirProducoes(code); // Processa as produções

  // Inicializa os conjuntos First para todos os não-terminais
  for (const nonTerminal in roles) {
    firsts[nonTerminal] = new Set(); // Usamos Set para evitar duplicatas
  }

  let changed;
  do {
    changed = false; // Flag para verificar se houve mudança nos conjuntos First

    // Itera sobre cada não-terminal e suas produções
    for (const nonTerminal in roles) {
      const productions = roles[nonTerminal];

      // Itera sobre cada produção do não-terminal
      for (const production of productions) {
        // Itera sobre os símbolos da produção
        for (let i = 0; i < production.length; i++) {
          const symbol = production[i];

          // Se o símbolo é um terminal, adiciona ao First e para
          if (isTerminal(symbol)) {
            const beforeSize = firsts[nonTerminal].size;
            firsts[nonTerminal].add(symbol);
            if (firsts[nonTerminal].size > beforeSize) {
              changed = true; // Houve mudança
            }
            break; // Passa para a próxima produção
          }

          // Se o símbolo é um não-terminal, adiciona o First dele ao First atual
          else {
            const beforeSize = firsts[nonTerminal].size;
            firsts[nonTerminal] = new Set([...firsts[nonTerminal], ...firsts[symbol]]);
            if (firsts[nonTerminal].size > beforeSize) {
              changed = true; // Houve mudança
            }

            // Se o First do símbolo não contém ε, para de processar a produção
            if (!firsts[symbol].has('ε')) {
              break;
            }

            // Se chegou ao final da produção e todos os símbolos podem derivar ε, adiciona ε ao First
            if (i === production.length - 1) {
              firsts[nonTerminal].add('ε');
            }
          }
        }
      }
    }
  } while (changed); // Repete até que não haja mais mudanças

  // Converte os Sets para arrays para facilitar a leitura
  for (const nonTerminal in firsts) {
    firsts[nonTerminal] = Array.from(firsts[nonTerminal]);
  }

  return firsts;
};

const findFollow = (code, firsts) => {
  const follows = {}; // Objeto para armazenar os conjuntos Follow
  const roles = unirProducoes(code); // Processa as produções

  // Inicializa os conjuntos Follow para todos os não-terminais
  for (const nonTerminal in roles) {
    follows[nonTerminal] = new Set();
  }

  // O símbolo inicial sempre contém o símbolo de fim de cadeia ($)
  const startSymbol = Object.keys(roles)[0]; // Assume que o primeiro não-terminal é o símbolo inicial
  follows[startSymbol].add('$');

  let changed;
  do {
    changed = false; // Flag para verificar se houve mudança nos conjuntos Follow

    // Itera sobre cada não-terminal e suas produções
    for (const nonTerminal in roles) {
      const productions = roles[nonTerminal];

      // Itera sobre cada produção do não-terminal
      for (const production of productions) {
        // Itera sobre os símbolos da produção
        for (let i = 0; i < production.length; i++) {
          const symbol = production[i];

          // Se o símbolo é um não-terminal, calcula o Follow
          if (!isTerminal(symbol)) {
            // Caso 1: Símbolo não-terminal não é o último da produção
            if (i < production.length - 1) {
              const nextSymbol = production[i + 1];

              // Se o próximo símbolo é um terminal, adiciona ao Follow do símbolo atual
              if (isTerminal(nextSymbol)) {
                const beforeSize = follows[symbol].size;
                follows[symbol].add(nextSymbol);
                if (follows[symbol].size > beforeSize) {
                  changed = true;
                }
              }
              // Se o próximo símbolo é um não-terminal, adiciona o First dele ao Follow do símbolo atual
              else {
                const beforeSize = follows[symbol].size;
                const firstOfNext = firsts[nextSymbol];
                for (const terminal of firstOfNext) {
                  if (terminal !== 'ε') {
                    follows[symbol].add(terminal);
                  }
                }
                if (follows[symbol].size > beforeSize) {
                  changed = true;
                }

                // Se o First do próximo símbolo contém ε, adiciona o Follow do não-terminal atual
                if (firstOfNext.includes('ε')) {
                  const beforeSize = follows[symbol].size;
                  for (const terminal of follows[nonTerminal]) {
                    follows[symbol].add(terminal);
                  }
                  if (follows[symbol].size > beforeSize) {
                    changed = true;
                  }
                }
              }
            }
            // Caso 2: Símbolo não-terminal é o último da produção
            else {
              const beforeSize = follows[symbol].size;
              for (const terminal of follows[nonTerminal]) {
                follows[symbol].add(terminal);
              }
              if (follows[symbol].size > beforeSize) {
                changed = true;
              }
            }
          }
        }
      }
    }
  } while (changed); // Repete até que não haja mais mudanças

  // Converte os Sets para arrays para facilitar a leitura
  for (const nonTerminal in follows) {
    follows[nonTerminal] = Array.from(follows[nonTerminal]);
  }

  return follows;
};

const separateProduction = (production) => {
  let word = '';
  let words = [];
  for (let i = 0; i < production.length; i++) {
    if (production[i] >= 'A' && production[i] <= 'Z' && i !== 0) {
      if (word !== '') {
        words.push(word)
        word = ''
      } if (i === production.length - 1) {
        words.push(production[i])
      }
      word = production[i]
    } else if (production[i] === ' ') {
      words.push(word);
      word = '';
    } else if (isOperator(production[i])) {
      if (word !== '') {
        words.push(word)
        word = ''
      } if (i === production.length - 1) {
        words.push(production[i])
      }
      word = production[i]
    }

    else if (i === production.length - 1) {
      word += production[i];
      words.push(word);
    } else {
      word += production[i];
    }
  }
  return words;
};

function unirProducoes(code) {
  let derivations = {}
  for (const element in code) {
    let productions = code[element];
    productions = productions.map((production) => {
      const words = separateProduction(production);
      return words
    });
    derivations[element] = productions
  }
  return derivations
}

function isOperator(value) {
  const operators = ['+', '-', '*', '/', '(', ')', ';']
  return operators.includes(value)
}

const readedCode = codeReader(code);

const isTerminal = (value) => {
  const nonTerminals = Object.keys(readedCode);
  return !nonTerminals.includes(value);
};

const firsts = findFirst(readedCode)
console.log('FIRSTS\n')
console.log(firsts)
console.log('\n\nFOLLOWS\n')
console.log(findFollow(readedCode, firsts));
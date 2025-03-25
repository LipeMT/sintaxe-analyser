const isOperator = (value) => {
  const operators = ['+', '-', '*', '/', '(', ')', ';'];
  return operators.includes(value);
};

const separateProduction = (production) => {
  let word = '';
  let words = [];
  
  for (let i = 0; i < production.length; i++) {
    if (production[i] >= 'A' && production[i] <= 'Z' && i !== 0) {
      if (word !== '') {
        words.push(word);
        word = '';
      }
      if (i === production.length - 1) {
        words.push(production[i]);
      }
      word = production[i];
    } else if (production[i] === ' ') {
      words.push(word);
      word = '';
    } else if (isOperator(production[i])) {
      if (word !== '') {
        words.push(word);
        word = '';
      }
      if (i === production.length - 1) {
        words.push(production[i]);
      }
      word = production[i];
    } else if (i === production.length - 1) {
      word += production[i];
      words.push(word);
    } else {
      word += production[i];
    }
  }
  return words;
};

const processProductions = (code) => {
  let derivations = {};
  for (const element in code) {
    let productions = code[element];
    productions = productions.map((production) => {
      const words = separateProduction(production);
      return words;
    });
    derivations[element] = productions;
  }
  return derivations;
};

const calculateProductionFirst = (production, firsts, isTerminal) => {
  const result = new Set();
  let canDeriveEpsilon = true;

  for (const symbol of production) {
    if (isTerminal(symbol)) {
      result.add(symbol);
      canDeriveEpsilon = false;
      break;
    } else {
      for (const terminal of firsts[symbol]) {
        if (terminal !== 'ϵ') result.add(terminal);
      }

      if (!firsts[symbol].includes('ϵ')) {
        canDeriveEpsilon = false;
        break;
      }
    }
  }

  if (canDeriveEpsilon) {
    result.add('ϵ');
  }

  return Array.from(result);
};

const displayParsingTable = (table) => {
  const result = {};
  for (const nonTerminal in table) {
    result[nonTerminal] = {};
    for (const terminal in table[nonTerminal]) {
      result[nonTerminal][terminal] = table[nonTerminal][terminal].join('');
    }
  }
  return result;
};

module.exports = {
  isOperator,
  separateProduction,
  processProductions,
  calculateProductionFirst,
  displayParsingTable
};
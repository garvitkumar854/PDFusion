/**
 * Tiny four-operation expression evaluator used by the calculator.
 *
 * It replaces the previous `new Function('return ' + expression)()`, which was
 * an eval-equivalent: it required `unsafe-eval` in any CSP and it evaluated the
 * string with full JavaScript number-literal grammar (`0176` was read as octal
 * 126, `//` started a comment). This evaluates the same four operations without
 * ever compiling a string as code, and treats numbers as decimal.
 */

type Token = { type: 'number'; value: number } | { type: 'operator'; value: string };

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

function applyOperator(operator: string, left: number, right: number): number {
  switch (operator) {
    case '+': return left + right;
    case '-': return left - right;
    case '*': return left * right;
    case '/': return left / right;
    default: throw new Error(`Unknown operator: ${operator}`);
  }
}

/**
 * Splits the expression into numbers and `+ - * /` operators. A `+`/`-` that
 * appears where an operand is expected (start of input, or right after another
 * operator) is a sign and is folded into the number that follows it. Anything
 * else in that position is malformed.
 */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let pendingSign = 1;

  while (i < input.length) {
    const char = input[i];

    if (char === ' ') {
      i += 1;
      continue;
    }

    const expectsOperand = tokens.length === 0 || tokens[tokens.length - 1].type === 'operator';

    if ((char >= '0' && char <= '9') || char === '.') {
      let raw = '';
      while (i < input.length && ((input[i] >= '0' && input[i] <= '9') || input[i] === '.')) {
        raw += input[i];
        i += 1;
      }
      // Exponent form. `=` feeds the previous result back in as the new
      // expression, and very large/small results stringify as e.g. "-2.5e-9".
      if (i < input.length && (input[i] === 'e' || input[i] === 'E')) {
        let exponent = 'e';
        let j = i + 1;
        if (j < input.length && (input[j] === '+' || input[j] === '-')) {
          exponent += input[j];
          j += 1;
        }
        if (j < input.length && input[j] >= '0' && input[j] <= '9') {
          while (j < input.length && input[j] >= '0' && input[j] <= '9') {
            exponent += input[j];
            j += 1;
          }
          raw += exponent;
          i = j;
        }
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid number: ${raw}`);
      }
      const signed = pendingSign * value;
      pendingSign = 1;
      tokens.push({ type: 'number', value: signed });
      continue;
    }

    if (char === '+' || char === '-') {
      if (expectsOperand) {
        if (char === '-') pendingSign *= -1;
        i += 1;
        continue;
      }
      tokens.push({ type: 'operator', value: char });
      i += 1;
      continue;
    }

    if (char === '*' || char === '/') {
      if (expectsOperand) {
        throw new Error('Expression cannot start with ' + char);
      }
      tokens.push({ type: 'operator', value: char });
      i += 1;
      continue;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  if (tokens.length === 0 || tokens[tokens.length - 1].type === 'operator') {
    throw new Error('Incomplete expression');
  }

  return tokens;
}

/** Shunting-yard: infix tokens -> postfix (RPN). */
function toPostfix(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(token);
      continue;
    }
    while (
      stack.length > 0 &&
      PRECEDENCE[(stack[stack.length - 1] as { value: string }).value] >= PRECEDENCE[token.value]
    ) {
      output.push(stack.pop()!);
    }
    stack.push(token);
  }

  while (stack.length > 0) {
    output.push(stack.pop()!);
  }

  return output;
}

function evaluatePostfix(postfix: Token[]): number {
  const values: number[] = [];

  for (const token of postfix) {
    if (token.type === 'number') {
      values.push(token.value);
      continue;
    }
    const right = values.pop();
    const left = values.pop();
    if (right === undefined || left === undefined) {
      throw new Error('Malformed expression');
    }
    values.push(applyOperator(token.value, left, right));
  }

  if (values.length !== 1) {
    throw new Error('Malformed expression');
  }

  return values[0];
}

export function evaluateExpression(input: string): number {
  return evaluatePostfix(toPostfix(tokenize(input)));
}

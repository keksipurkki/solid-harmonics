/**
 *
 * Utilities inspired by Python itertools
 *
 * @see https://docs.python.org/3/library/itertools.html
 *
 */

const assert = require("assert");

function takeWhile(predicate, generator) {
  return function*(...args) {
    for (const item of generator(...args)) {
      if (!predicate(item)) {
        break;
      }
      yield item;
    }
  };
}

function filter(predicate, generator) {
  return function*(...args) {
    for (const item of generator(...args)) {
      if (predicate(item)) {
        yield item;
      }
    }
  };
}

function enumerate(generator) {
  return function*(...args) {
    let i = 0;
    for (const item of generator(...args)) {
      yield [i++, item];
    }
  };
}

function* zip(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    yield [a[i], b[i]];
  }
}

function* cartesian(...inputs) {
  function* helper(lists, prefix = []) {
    if (lists.length === 0) {
      yield [];
    } else {
      const [head, ...rest] = lists;
      for (let item of head) {
        const newPrefix = prefix.concat(item);
        if (rest.length) {
          yield* helper(rest, newPrefix);
        } else {
          yield newPrefix;
        }
      }
    }
  }
  yield* helper(inputs);
}

function* range(min, max) {
  assert(
    Number.isInteger(min) && Number.isInteger(max),
    "integer input required"
  );
  assert(min <= max, "min must be smaller or equal to max");
  for (let i = min; i < max; i++) {
    yield i;
  }
}

module.exports = {
  cartesian,
  zip,
  takeWhile,
  enumerate,
  range,
  filter,
};

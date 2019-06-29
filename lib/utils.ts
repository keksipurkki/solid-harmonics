class AssertionError extends Error {}

/**
 *
 * Kronecker delta function
 *
 */
export const ij = (i: number, j: number) => (i === j ? 1 : 0);

/**
 *
 * Simple assertion implementation
 *
 */
export function assert(expr: any, message?: string) {
  if (!expr) throw new AssertionError(message);
}

/**
 *
 * Iterate over [min, max)
 *
 */
export function* range(min: number, max: number) {
  assert(Number.isInteger(min) && Number.isInteger(max), "integer input required");
  assert(min <= max, "min must be smaller or equal to max");
  for (let i = min; i < max; i++) {
    yield i;
  }
}

/**
 *
 * Iterate over the result of a generator while a predicate is true
 *
 */
export function takeWhile<T, G extends AnyGenerator<T>>(p: Predicate<T>, g: G): G {
  const result = function*(...args: any[]) {
    for (const item of g(...args)) {
      if (!p(item)) {
        break;
      }
      yield item;
    }
  };
  return result as G;
}

/**
 *
 * Yield those elements of a generator that satisfy a predicate
 *
 */
export function filter<T, G extends AnyGenerator<T>>(p: Predicate<T>, g: G): G {
  const result = function*(...args: any[]) {
    for (const item of g(...args)) {
      if (p(item)) {
        yield item;
      }
    }
  };
  return result as G;
}

export function enumerate<T, G extends AnyGenerator<T>>(generator: G) {
  const result = function*(...args: any[]) {
    let i = 0;
    for (const item of generator(...args)) {
      yield [i++, item];
    }
  };
  return result as AnyGenerator<[number, T]>;
}

export function* zip<A, B>(a: ArrayLike<A>, b: ArrayLike<B>) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    yield [a[i], b[i]] as [A, B];
  }
}

export function* cartesian(...inputs: any[]) {
  function* helper(lists: any[], prefix = []): any {
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

/**
 *
 * Allocate multidimensional arrays
 *
 */

const allocatorFactory = <V>(initialValue: V) => {
  const allocator: NDAllocator<V> = (dim: number, ...rest: number[]) => {
    if (!dim) {
      throw new Error("at least one dimension is required");
    }

    if (!rest.length) {
      return Array(dim).fill(initialValue);
    }

    const [nextDim, ...dims] = rest;

    const result = Array(dim)
      .fill(undefined)
      .map(_ => allocator(nextDim, ...dims));

    return result;
  };

  return allocator;
};

export const zeros = allocatorFactory<number>(0);
export const ones = allocatorFactory<number>(1);

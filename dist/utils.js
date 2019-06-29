class AssertionError extends Error {
}
/**
 *
 * Kronecker delta function
 *
 */
export const ij = (i, j) => (i === j ? 1 : 0);
/**
 *
 * Simple assertion implementation
 *
 */
export function assert(expr, message) {
    if (!expr)
        throw new AssertionError(message);
}
/**
 *
 * Iterate over [min, max)
 *
 */
export function* range(min, max) {
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
export function takeWhile(p, g) {
    const result = function* (...args) {
        for (const item of g(...args)) {
            if (!p(item)) {
                break;
            }
            yield item;
        }
    };
    return result;
}
/**
 *
 * Yield those elements of a generator that satisfy a predicate
 *
 */
export function filter(p, g) {
    const result = function* (...args) {
        for (const item of g(...args)) {
            if (p(item)) {
                yield item;
            }
        }
    };
    return result;
}
export function enumerate(generator) {
    const result = function* (...args) {
        let i = 0;
        for (const item of generator(...args)) {
            yield [i++, item];
        }
    };
    return result;
}
export function* zip(a, b) {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        yield [a[i], b[i]];
    }
}
export function* cartesian(...inputs) {
    function* helper(lists, prefix = []) {
        if (lists.length === 0) {
            yield [];
        }
        else {
            const [head, ...rest] = lists;
            for (let item of head) {
                const newPrefix = prefix.concat(item);
                if (rest.length) {
                    yield* helper(rest, newPrefix);
                }
                else {
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
const allocatorFactory = (initialValue) => {
    const allocator = (dim, ...rest) => {
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
export const zeros = allocatorFactory(0);
export const ones = allocatorFactory(1);

import { Polynomial3D, Monomial3D } from "./polynomial.js";
import { assert, range, ij } from "./utils.js";
import augment from "./harmonics-evaluation.js";
const { ONE, Y, X, Z } = Monomial3D;
const { sqrt } = Math;
function A(l) {
    return sqrt((Math.pow(2, ij(l, 0)) * (2 * l + 1)) / (2 * l + 2));
}
function recurrenceMin(S, l) {
    const a = A(l);
    const monoA = new Monomial3D(Y, a);
    const monoB = new Monomial3D(X, a);
    return S[l][l].times(monoA).plus(S[l][-l].times(monoB));
}
function recurrenceMax(S, l) {
    const a = A(l);
    const monoA = new Monomial3D(X, a);
    const monoB = new Monomial3D(Y, -a);
    return S[l][l].times(monoA).plus(S[l][-l].times(monoB));
}
function recurrenceMid(S, l, m) {
    const c0 = (2.0 * l + 1.0) / sqrt((l + m + 1.0) * (l - m + 1.0));
    let result = S[l][m].times(new Monomial3D(Z, c0));
    // Multiply by r ** 2 = x*x + y*y + z*z
    if (-l <= m + 1 && m + 1 <= l) {
        const c1 = -sqrt(((l + m) * (l - m)) / ((l + m + 1.0) * (l - m + 1.0)));
        const monos = [
            new Monomial3D([2, 0, 0], c1),
            new Monomial3D([0, 2, 0], c1),
            new Monomial3D([0, 0, 2], c1),
        ];
        const polys = monos.map(mono => S[l - 1][m].times(mono));
        result = polys.reduce((poly, p) => poly.plus(p), result);
    }
    return result;
}
/**
 *
 * Support referencing arrays with negative indices
 *
 */
const proxyHandler = {
    get(target, prop) {
        if (typeof prop === "symbol") {
            return target.toString;
        }
        let index = prop;
        index = Number(prop);
        if (index < 0) {
            index += target.length;
        }
        return target[index];
    },
    set(target, prop, value) {
        let index = Number(prop);
        if (index < 0) {
            index += target.length;
        }
        target[index] = value;
        return true;
    },
};
/**
 *
 * Models a collection of regular solid harmonics. The harmonics are referenced by the
 * indices `l` and `m` subject to
 *
 * $ 0 <= l <= lmax $ and
 * $ abs(m) <= l $
 *
 * @see
 *
 *  Trygve Helgaker, Poul Jorgensen, Jeppe Olsen
 *  ``Molecular Electronic-Structure Theory``
 *  p. 215
 *  ISBN: 978-0-471-96755-2
 *
 *  for the derivation of the recurrence relations
 */
class SphericalHarmonics extends Array {
    constructor(lmax) {
        super(lmax + 1);
        this.lmax = lmax;
        if (!Number.isInteger(lmax) || lmax < 0) {
            throw new Error("expected a non-negative integer");
        }
        for (let l = 0; l <= lmax; l++) {
            this[l] = Array(2 * l + 1).fill(new Polynomial3D());
            this[l] = new Proxy(this[l], proxyHandler);
        }
        // Precompute the first regular harmonics 1, x, y, and z
        this[0][0] = new Polynomial3D([ONE, 1]); // 1
        this[1][-1] = new Polynomial3D([Y, 1]); // y
        this[1][1] = new Polynomial3D([X, 1]); // x
        this[1][0] = new Polynomial3D([Z, 1]); // z
        // Vertical recursion
        for (const l of range(1, this.lmax)) {
            this[l + 1][-(l + 1)] = recurrenceMin(this, l);
            this[l + 1][l + 1] = recurrenceMax(this, l);
            assert(this[l + 1][-(l + 1)], `could not generate harmonic (${l + 1}, ${-(l + 1)})`);
            assert(this[l + 1][l + 1], `could not generate harmonic (${l + 1}, ${l + 1})`);
            // Horizontal recursion
            for (const m of range(-l, l + 1)) {
                this[l + 1][m] = recurrenceMid(this, l, m);
                assert(this[l + 1][m], `could not generate harmonic (${l + 1}, ${m})`);
            }
        }
    }
    /**
     *
     * Support iterating over the harmonics
     *
     */
    *[Symbol.iterator]() {
        for (let l = 0; l <= this.lmax; l++) {
            for (let m = -l; m <= l; m++) {
                yield [l, m, this[l][m]];
            }
        }
    }
}
augment(SphericalHarmonics);
export { SphericalHarmonics };

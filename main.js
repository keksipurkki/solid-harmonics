#!/usr/bin/env node

const assert = require("assert");
const { Monomial3D, Polynomial3D } = require("./polynomial");
const { range, cartesian, filter } = require("./itertools");
const { sqrt } = Math;
const { X, Y, Z, ONE } = Monomial3D;

("use strict");

/**
 *
 * Fast evaluation of solid harmonics over 3D meshgrids
 *
 */

function zeros(nrows, ncols) {
  const out = [];
  for (let i = 0; i < nrows; i++) {
    out.push(Array(ncols).fill(0));
  }
  return out;
}

const idx = (l, m) => l * (l + 1) + m;
const ij = (i, j) => (i === j ? 1 : 0);

/**
 *
 * Array with support for negative indexing
 *
 * Negative indexes reference items from the end of the array, i.e. the nindex -1 points
 * to array.length - 1 etc.
 *
 */
function _Array(...args) {
  return new Proxy(new Array(...args), {
    get(target, prop) {
      let index = Number(prop);
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
  });
}

/**
 *
 * @see
 *
 *  Trygve Helgaker, Poul Jorgensen, Jeppe Olsen
 *  ``Molecular Electronic-Structure Theory``
 *  p. 215
 *  ISBN: 978-0-471-96755-2
 *
 *  for the derivation of the recurrence relations
 *
 */
class SolidHarmonics {
  constructor(lmax) {
    this.lmax = lmax;
    this.S = this.generate(lmax);
    const nrow = (lmax + 1) ** 2;
    const ncol = ((lmax + 1) * (lmax + 2) * (lmax + 3)) / 6;
    this.cache = zeros(nrow, ncol);
    this.kappa = [...this.cartiter(lmax)];

    console.log(this.S);

    for (const l of range(0, lmax + 1)) {
      for (const m of range(-l, l + 1)) {
        for (const [k, v] of this.S[l][m].terms) {
          const i = idx(l, m);
          const j = this._lexicopos(k, lmax);
          // Cache the coefficients
          this.cache[i][j] = v;
        }
      }
    }

    console.log(this.kappa);
  }

  /**
    Recursively generate the solid harmonics

    Each monomial is identified as (i,j,k):c where i, j, k are exponents and c is the
    coefficient; a polynomial is then a dictionary of these monomials

    The solid harmonics are indexed with 0 <= l <= lmax and abs(m) <= l: S[l][m]

    */
  generate(lmax) {
    const S = [...range(0, lmax + 1)].map(l => _Array(...range(0, 2 * l + 1)));

    // Precompute the first regular harmonics 1, x, y, and z
    S[0][0] = new Polynomial3D([ONE, 1]); // 1
    S[1][-1] = new Polynomial3D([Y, 1]); // y
    S[1][1] = new Polynomial3D([X, 1]); // x
    S[1][0] = new Polynomial3D([Z, 1]); // z

    // Vertical recursion
    for (const l of range(1, lmax)) {
      S[l + 1][-(l + 1)] = this._recurrenceMin(S, l);
      S[l + 1][l + 1] = this._recurrenceMax(S, l);

      assert(
        S[l + 1][-(l + 1)],
        `could not generate harmonic (${l + 1}, ${-(l + 1)})`
      );

      assert(
        S[l + 1][l + 1],
        `could not generate harmonic (${l + 1}, ${l + 1})`
      );

      // Horizontal recursion
      for (const m of range(-l, l + 1)) {
        S[l + 1][m] = this._recurrenceMid(S, l, m);
        assert(S[l + 1][m], `could not generate harmonic (${l + 1}, ${m})`);
      }
    }

    return S;
  }

  _A(l) {
    return sqrt((2 ** ij(l, 0) * (2 * l + 1)) / (2 * l + 2));
  }

  _recurrenceMin(S, l) {
    const c0 = this._A(l);
    const a = new Polynomial3D(S[l][l].terms);
    const b = new Polynomial3D(S[l][-l].terms);
    return a.times(new Monomial3D(Y, c0)).plus(b.times(new Monomial3D(X, c0)));
  }

  _recurrenceMax(S, l) {
    const c0 = this._A(l);
    const a = new Polynomial3D(S[l][l].terms);
    const b = new Polynomial3D(S[l][-l].terms);
    return a.times(new Monomial3D(X, c0)).plus(b.times(new Monomial3D(Y, -c0)));
  }

  _recurrenceMid(S, l, m) {
    const { terms } = S[l][m];
    const c0 = (2.0 * l + 1.0) / sqrt((l + m + 1.0) * (l - m + 1.0));
    let result = new Polynomial3D(terms);
    result = result.times(new Monomial3D(Z, c0));

    if (-l <= m + 1 && m + 1 <= l) {
      const c0 = -sqrt(((l + m) * (l - m)) / ((l + m + 1.0) * (l - m + 1.0)));

      const exponents = [
        [2, 0, 0], // x*x
        [0, 2, 0], // y*y
        [0, 0, 2], // z*z
      ];

      // Multiply by r ** 2 = x*x + y*y + z*z
      for (let i = 0; i < 3; i++) {
        const mono = new Monomial3D(exponents[i]);
        result = result.times(mono);
      }

      result = result.times(c0);
    }

    return result;
  }

  _lexicopos([a, b, c], lmax) {
    let pos =
      6 +
      11 * a -
      6 * a * a +
      a * a * a +
      9 * b -
      6 * a * b -
      3 * b * b +
      6 * c;
    pos =
      pos +
      12 * a * lmax -
      3 * a * a * lmax +
      6 * b * lmax +
      3 * a * lmax * lmax;
    pos = pos / 6;
    return pos - 1;
  }

  cartiter(lmax) {
    const output = filter(([a, b, c]) => a + b + c <= lmax, cartesian);
    const r = [...range(0, lmax + 1)];
    return output(r, r, r);
  }

  eval(_points) {
    return;
  }
}

function main() {
  const lmax = 2;
  const S = new SolidHarmonics(lmax);
  // Evaluate the set at (0,0,0), (1,0,0) and (1,1,1)
  console.log(S.eval([[0, 0, 0], [1, 0, 0], [1, 1, 1]]));
}

main();

const assert = require("assert");
const { Monomial3D, Polynomial3D } = require("./polynomial");
const { range, cartesian, filter } = require("./itertools");
const { sqrt } = Math;
const { X, Y, Z, ONE } = Monomial3D;


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

function cartiter(lmax) {
  const output = filter(([a, b, c]) => a + b + c <= lmax, cartesian);
  const r = [...range(0, lmax + 1)];
  return output(r, r, r);
}

function lexicopos([a, b, c], lmax) {
  let pos =
    6 + 11 * a - 6 * a * a + a * a * a + 9 * b - 6 * a * b - 3 * b * b + 6 * c;
  pos =
    pos + 12 * a * lmax - 3 * a * a * lmax + 6 * b * lmax + 3 * a * lmax * lmax;
  pos = pos / 6;
  return pos - 1;
}

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

class SolidHarmonicArray extends Array {
  constructor(lmax) {
    super(lmax + 1);
    this.lmax = lmax;

    for (let l = 0; l <= lmax; l++) {
      this[l] = Array(2 * l + 1).fill(new Polynomial3D());
      this[l] = new Proxy(this[l], this._negativeIndexing);
    }

    // Precompute the first regular harmonics 1, x, y, and z
    this[0][0] = new Polynomial3D([ONE, 1]); // 1
    this[1][-1] = new Polynomial3D([Y, 1]); // y
    this[1][1] = new Polynomial3D([X, 1]); // x
    this[1][0] = new Polynomial3D([Z, 1]); // z

    // Vertical recursion
    for (const l of range(1, lmax)) {
      this[l + 1][-(l + 1)] = _recurrenceMin(this, l);
      this[l + 1][l + 1] = _recurrenceMax(this, l);

      assert(
        this[l + 1][-(l + 1)],
        `could not generate harmonic (${l + 1}, ${-(l + 1)})`
      );

      assert(
        this[l + 1][l + 1],
        `could not generate harmonic (${l + 1}, ${l + 1})`
      );

      // Horizontal recursion
      for (const m of range(-l, l + 1)) {
        this[l + 1][m] = _recurrenceMid(this, l, m);
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

  /**
   *
   * Supporting referencing with a negative index
   *
   */
  get _negativeIndexing() {
    return {
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
  }
}

function _A(l) {
  return sqrt((2 ** ij(l, 0) * (2 * l + 1)) / (2 * l + 2));
}

function _recurrenceMin(S, l) {
  const c0 = _A(l);
  return S[l][l]
    .times(new Monomial3D(Y, c0))
    .plus(S[l][-l].times(new Monomial3D(X, c0)));
}

function _recurrenceMax(S, l) {
  const c0 = _A(l);
  return S[l][l]
    .times(new Monomial3D(X, c0))
    .plus(S[l][-l].times(new Monomial3D(Y, -c0)));
}

function _recurrenceMid(S, l, m) {
  const c0 = (2.0 * l + 1.0) / sqrt((l + m + 1.0) * (l - m + 1.0));
  let result = S[l][m].times(new Monomial3D(Z, c0));

  // Multiply by r ** 2 = x*x + y*y + z*z
  if (-l <= m + 1 && m + 1 <= l) {
    const c1 = -sqrt(((l + m) * (l - m)) / ((l + m + 1.0) * (l - m + 1.0)));
    const monos = [
      new Monomial3D([2, 0, 0], c1), // x*x
      new Monomial3D([0, 2, 0], c1), // y*y
      new Monomial3D([0, 0, 2], c1), // z*z
    ];
    const polys = monos.map(mono => new Polynomial3D(S[l - 1][m]).times(mono));
    result = polys.reduce((poly, p) => poly.plus(p), result);
  }
  return result;
}

/**
 *
 * Returns a function that evaluates solid harmonics over 3D meshgrids
 *
 */
function SolidHarmonics(lmax) {
  const S = new SolidHarmonicArray(lmax);

  const nrow = (lmax + 1) ** 2;
  const ncol = ((lmax + 1) * (lmax + 2) * (lmax + 3)) / 6;
  const cache = zeros(nrow, ncol);
  const kappa = [...cartiter(lmax)];

  for (const [l, m, Slm] of S) {
    for (const [k, v] of Slm.terms) {
      const i = idx(l, m);
      const j = lexicopos(k, lmax);
      // Cache the coefficients
      cache[i][j] = v;
    }
  }

  return _points => {};
}

module.exports = {
  SolidHarmonicArray,
  SolidHarmonics
};

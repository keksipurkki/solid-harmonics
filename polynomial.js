"use strict";

/**
 * Represent a monomial of the form
 *
 * coeff * x**a * y**b * z ** b
 *
 * The exponents a,b,c are limited to 10-bit integers.
 *
 */
function Monomial3D([a, b, c], coeff = 1) {
  if (a > 2 ** 10) throw new Error("maximum exponent is 1024");
  if (b > 2 ** 10) throw new Error("maximum exponent is 1024");
  if (c > 2 ** 10) throw new Error("maximum exponent is 1024");
  this._exponent = (c << 20) | (b << 10) | a;
  this._coeff = coeff;
}

Monomial3D.prototype = {
  get exponent() {
    const a = this._exponent & 0x3ff;
    const b = (this._exponent >>> 10) & 0x3ff;
    const c = (this._exponent >>> 20) & 0x3ff;
    return [a, b, c];
  },
  get coeff() {
    return this._coeff;
  },
  [Symbol.toPrimitive](hint) {
    if (hint !== "string") {
      return;
    }

    const exponent = this.exponent;

    let t = [..."xyz"].map((s, i) => {
      switch (exponent[i]) {
        case 0:
          return "";
        case 1:
          return s;
        default:
          return `${s}**${exponent[i]}`;
      }
    });

    t = t.filter(Boolean);

    if (!t.length) {
      return `${this.coeff.toFixed(4)}`;
    } else {
      return `${this.coeff.toFixed(4)} * ${t.join(" * ")}`;
    }
  },
};

Monomial3D.X = Object.freeze([1, 0, 0]);
Monomial3D.Y = Object.freeze([0, 1, 0]);
Monomial3D.Z = Object.freeze([0, 0, 1]);
Monomial3D.ONE = Object.freeze([0, 0, 0]);

Monomial3D.constant = function(coeff) {
  return new Monomial3D(Monomial3D.ONE, coeff);
};

/**
 *
 * Represent a polynomial
 *
 */
function Polynomial3D(...terms) {
  this._monomials = {};
  terms
    .filter(([, c]) => Boolean(c))
    .forEach(term => {
      const mono = new Monomial3D(...term);
      this._monomials[mono._exponent] = mono;
    });
}

Polynomial3D.prototype = {
  plus: function(summand) {
    if (summand instanceof Polynomial3D) {
      return Object.values(summand._monomials).reduce(
        (poly, term) => poly.plus(term),
        this
      );
    }

    if (!(summand instanceof Monomial3D)) {
      throw new TypeError("expected a monomial");
    }

    this._monomials = { ...this._monomials };

    if (!this._monomials[summand._exponent]) {
      this._monomials[summand._exponent] = summand;
    } else {
      this._monomials[summand._exponent]._coeff += summand._coeff;
    }

    if (!this._monomials[summand._exponent].coeff) {
      delete this._monomials[summand._exponent];
    }

    if (Math.abs(this._monomials[summand._exponent].coeff) < Number.EPSILON) {
      delete this._monomials[summand._exponent];
    }

    return this;
  },

  /**
   * @param term number | Monomial3D
   */
  times: function(term) {
    const constant = Number(term);

    if (!isNaN(constant)) {

      return this.times(Monomial3D.constant(constant));

    } else if (term instanceof Monomial3D) {

      const terms = [];
      const [i, j, k] = term.exponent;

      Object.values(this._monomials).forEach(mono => {
        let [a, b, c] = mono.exponent;
        terms.push([[a + i, b + j, c + k], mono.coeff * term.coeff ]);
      });

      return new Polynomial3D(...terms);

    } else {
      throw new Error("expected a monomial or a scalar constant");
    }
  },

  get terms() {
    const result = Object.values(this._monomials).map(m => [
      m.exponent,
      m.coeff,
    ]);
    return result;
  },

  [Symbol.toPrimitive]: function() {
    return `Polynomial3D{ ${Object.values(this._monomials)
      .map(String)
      .join(" + ")
      .replace(/ \+ -/g, " − ")} }`;
  },
};

module.exports = {
  Monomial3D,
  Polynomial3D,
};

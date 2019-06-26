"use strict";

/**
 * Represent a monomial of the form
 *
 * coeff * x**a * y**b * z ** b
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
  toString() {
    return `Monomial3D { coeff = ${this.coeff}, exponent = [${this.exponent}] }`;
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
  this._terms = [];
  terms
    .filter(([, c]) => Boolean(c))
    .forEach(term => this._terms.push(new Monomial3D(...term)));
}

Polynomial3D.prototype = {
  plus: function(summand) {

    if (summand instanceof Polynomial3D) {
      let result = new Polynomial3D();
      for (const mono of summand._terms) {
        result = result.plus(mono);
      }
      return result;
    }

    if (!(summand instanceof Monomial3D)) {
      throw new TypeError("expected a monomial");
    }

    this._terms = [...this._terms];

    if (!this.terms[summand._exponent]) {
      this._terms[summand._exponent] = summand;
    } else {
      this._terms[summand._exponent]._coeff += summand._coeff;
    }

    if (!this._terms[summand._exponent].coeff) {
      delete this._terms[summand._exponent];
    }

    if (this.term[summand._exponent].coeff < Number.EPSILON) {
      delete this._terms[summand._exponent];
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

      const newTerms = [];
      const [i, j, k] = term.exponent;

      this.terms.forEach(mono => {
        let [a, b, c] = mono.exponent;
        a += i;
        b += j;
        c += k;
        const coeff = mono.coeff * term.coeff;
        const result = new Monomial3D([a, b, c], coeff);
        newTerms[result._exponent] = result;
      });

      this._terms = newTerms;

      return this;

    } else {

      throw new Error("expected a monomial or a scalar constant");

    }
  },

  get terms() {
    return this._terms.map(m => [m.exponent, m.coeff]);
  },

  toString() {
    return `Polynomial3D{ [${this.terms}] }`;
  },
};

module.exports = {
  Monomial3D,
  Polynomial3D,
};

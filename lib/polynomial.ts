type Exponent3D = [number, number, number];
type Term3D = [Exponent3D, number];

/**
 * Represent a monomial of the form
 *
 * coeff * x**a * y**b * z ** b
 *
 * The exponents a,b,c are limited to 10-bit integers.
 *
 */
class Monomial3D {
  _exponent: number;
  private _coeff: number;

  constructor([a, b, c]: Exponent3D, coeff: number = 1) {
    if (a > 2 ** 10) throw new Error("maximum exponent is 1024");
    if (b > 2 ** 10) throw new Error("maximum exponent is 1024");
    if (c > 2 ** 10) throw new Error("maximum exponent is 1024");
    this._exponent = (c << 20) | (b << 10) | a;
    this._coeff = coeff;
  }

  get exponent() {
    const a = this._exponent & 0x3ff;
    const b = (this._exponent >>> 10) & 0x3ff;
    const c = (this._exponent >>> 20) & 0x3ff;
    return Object.freeze([a, b, c]) as Exponent3D;
  }

  get coeff() {
    return this._coeff;
  }

  get term(): Term3D {
    return [this.exponent, this.coeff];
  }

  [Symbol.toPrimitive](hint: string) {
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
  }

  static X = Object.freeze([1, 0, 0]) as Exponent3D;
  static Y = Object.freeze([0, 1, 0]) as Exponent3D;
  static Z = Object.freeze([0, 0, 1]) as Exponent3D;
  static ONE = Object.freeze([0, 0, 0]) as Exponent3D;

  static constant = function(coeff: number) {
    return new Monomial3D(Monomial3D.ONE, coeff);
  };
}

/**
 *
 * Represent a polynomial
 *
 */
class Polynomial3D {
  private _monomials: Record<number, Monomial3D>;

  constructor(...terms: (Term3D | Polynomial3D)[]) {
    this._monomials = {};
    let input: Term3D[] = [];

    terms.forEach(term => {
      if (term instanceof Polynomial3D) {
        input.push(...term.monomials.map(m => m.term));
      } else {
        input.push(term);
      }
    });

    input.forEach(term => {
      const mono = new Monomial3D(...term);

      if (!this._monomials[mono._exponent]) {
        this._monomials[mono._exponent] = mono;
      } else {
        const [exponent, coeff] = this._monomials[mono._exponent].term;

        this._monomials[mono._exponent] = new Monomial3D(
          exponent,
          coeff + mono.coeff
        );
      }
    });
  }

  plus(input: Polynomial3D | Monomial3D): Polynomial3D {
    switch (input.constructor) {
      case Polynomial3D: {
        const summand = input as Polynomial3D;
        const sum = new Polynomial3D(this);
        return summand.monomials.reduce((poly, term) => poly.plus(term), sum);
      }
      case Monomial3D: {
        const summand = input as Monomial3D;
        const monomial = this._monomials[summand._exponent];

        if (!monomial) {
          this._monomials[summand._exponent] = summand;
        } else {
          this._monomials[summand._exponent] = new Monomial3D(
            summand.exponent,
            summand.coeff + monomial.coeff
          );
        }

        if (this.termTooSmall(this._monomials[summand._exponent])) {
          delete this._monomials[summand._exponent];
        }

        return new Polynomial3D(this);

      }
      default:
        throw new TypeError("cannot add given input");
    }
  }

  termTooSmall(mono: Monomial3D) {
    const { coeff } = mono;
    return Math.abs(coeff) < Number.EPSILON;
  }

  times(term: number | Monomial3D): Polynomial3D {

    const constant = Number(term);

    if (!isNaN(constant)) {

      const monomial = Monomial3D.constant(constant);
      return this.times(monomial);

    } else if (term instanceof Monomial3D) {

      const terms: Term3D[] = [];
      const [i, j, k] = term.exponent;

      for (const mono of this.monomials) {
        let [a, b, c] = mono.exponent;
        terms.push([[a + i, b + j, c + k], mono.coeff * term.coeff]);
      }

      return new Polynomial3D(...terms);

    } else {

      throw new Error("cannot multiply given input");

    }
  }

  get monomials(): Monomial3D[] {
    return Object.values(this._monomials);
  }

  get length(): number {
    return this.monomials.length;
  }

  [Symbol.toPrimitive]() {
    return `Polynomial3D{ ${this.monomials
      .map(String)
      .join(" + ")
      .replace(/ \+ -/g, " − ")} }`;
  }
}

export { Monomial3D, Polynomial3D };

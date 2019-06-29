import { assert, filter, range, cartesian, zeros } from "./utils.js";
const idx = (l, m) => l * (l + 1) + m;
function cartiter(lmax) {
    const output = filter(([a, b, c]) => a + b + c <= lmax, cartesian);
    const r = [...range(0, lmax + 1)];
    return output(r, r, r);
}
function lexicopos([a, b, c], lmax) {
    let pos = 6 + 11 * a - 6 * a * a + a * a * a + 9 * b - 6 * a * b - 3 * b * b + 6 * c;
    pos = pos + 12 * a * lmax - 3 * a * a * lmax + 6 * b * lmax + 3 * a * lmax * lmax;
    pos = pos / 6;
    return pos - 1;
}
/**
 *
 * TODO: WASM?
 *
 */
function implementEvalAlgos(harmonics) {
    /**
     *
     * Returns a function that evaluates solid harmonics over 3D meshgrids
     *
     */
    harmonics.prototype.toFunction = function () {
        const lmax = this.lmax;
        const nrow = Math.pow((lmax + 1), 2);
        const ncol = ((lmax + 1) * (lmax + 2) * (lmax + 3)) / 6;
        const cache = zeros(nrow, ncol);
        const kappa = [...cartiter(lmax)];
        for (const [l, m, Slm] of this) {
            for (const [k, v] of Slm.terms) {
                const i = idx(l, m);
                const j = lexicopos(k, lmax);
                // Cache the coefficients
                cache[i][j] = v;
            }
        }
        assert(kappa.length === ncol);
        return (points) => {
            const array = zeros(points.length, kappa.length, 3);
            const result = zeros(points.length, nrow);
            for (let j = 0; j < points.length; j++) {
                const tmp = array[j];
                for (let i = 0; i < kappa.length; i++) {
                    // x => x**a, y => y**b, z => z** c
                    tmp[i][0] = Math.pow(points[j][0], kappa[i][0]);
                    tmp[i][1] = Math.pow(points[j][1], kappa[i][1]);
                    tmp[i][2] = Math.pow(points[j][2], kappa[i][2]);
                }
            }
            for (let i = 0; i < kappa.length; i++) {
                for (let j = 0; j < points.length; j++) {
                    // x**a * y**b * z**c
                    const xa = array[j][i][0];
                    const yb = array[j][i][1];
                    const zc = array[j][i][2];
                    const p = xa * yb * zc;
                    for (let k = 0; k < cache.length; k++) {
                        result[j][k] += cache[k][i] * p;
                    }
                }
            }
            return result;
        };
    };
    /**
     *
     * Evaluate the harmonics on the unit-sphere
     *
     */
    harmonics.prototype.toParametricSurface = function () {
    };
}
export default implementEvalAlgos;

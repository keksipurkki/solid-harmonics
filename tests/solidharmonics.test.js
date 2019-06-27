const test = require("tape");
const { SolidHarmonicArray } = require("../harmonics");

test("SolidHarmonicArray", describe => {
  describe.test("lmax = 3 / reference values are reproduced", it => {
    const lmax = 3;
    const S = new SolidHarmonicArray(lmax);

    it.plan((lmax + 1) ** 2);

    it.deepEqual(S[0][0].terms, [[[0, 0, 0], 1.0]], "l = 0, m = 0");

    // l = 1, m = -1, 0, 1
    it.deepEqual(S[1][-1].terms, [[[0, 1, 0], 1.0]], "l = 1, m = -1");
    it.deepEqual(S[1][0].terms, [[[0, 0, 1], 1.0]], "l = 1, m = 0");
    it.deepEqual(S[1][1].terms, [[[1, 0, 0], 1.0]], "l = 1, m = 1");

    // l = 2, m = -2, -1, 0, 1, 2
    it.deepEqual(
      S[2][-2].terms,
      [[[1, 1, 0], 1.7320508075688772]],
      "l = 2, m = -2"
    );
    it.deepEqual(
      S[2][-1].terms,
      [[[0, 1, 1], 1.7320508075688774]],
      "l = 2, m = -1"
    );
    it.deepEqual(
      S[2][0].terms,
      [[[2, 0, 0], -0.5], [[0, 2, 0], -0.5], [[0, 0, 2], 1]],
      "l = 2, m = 0"
    );
    it.deepEqual(
      S[2][1].terms,
      [[[1, 0, 1], 1.7320508075688774]],
      "l = 2, m = 1"
    );
    it.deepEqual(
      S[2][2].terms,
      [[[2, 0, 0], 0.8660254037844386], [[0, 2, 0], -0.8660254037844386]],
      "l = 2, m = 2"
    );

    // l = 3, m = -3, -2, -1, 0, 1, 2, 3
    it.deepEqual(
      S[3][-3].terms,
      [[[2, 1, 0], 2.3717082451262845], [[0, 3, 0], -0.7905694150420949]],
      "l = 3, m = -3"
    );

    it.deepEqual(
      S[3][-2].terms,
      [[[1, 1, 1], 3.872983346207417]],
      "l = 3, m = -2"
    );

    it.deepEqual(
      S[3][-1].terms,
      [
        [[2, 1, 0], -0.6123724356957945],
        [[0, 3, 0], -0.6123724356957945],
        [[0, 1, 2], 2.449489742783178],
      ],
      "l = 3, m = -1"
    );

    it.deepEqual(
      S[3][0].terms,
      [[[2, 0, 1], -1.5], [[0, 2, 1], -1.5], [[0, 0, 3], 1]],
      "l = 3, m = 0"
    );

    it.deepEqual(
      S[3][1].terms,
      [
        [[3, 0, 0], -0.6123724356957945],
        [[1, 2, 0], -0.6123724356957945],
        [[1, 0, 2], 2.449489742783178],
      ],
      "l = 3, m = 1"
    );

    it.deepEqual(
      S[3][2].terms,
      [[[2, 0, 1], 1.9364916731037085], [[0, 2, 1], -1.9364916731037085]],
      "l = 3, m = 2"
    );

    it.deepEqual(
      S[3][3].terms,
      [[[3, 0, 0], 0.7905694150420949], [[1, 2, 0], -2.3717082451262845]],
      "l = 3, m = 3"
    );
  });
});

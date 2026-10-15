# Automerge stores 0.9999999999999999 in a list as 0

Inserting the number `0.9999999999999999` (the largest double below 1, `1 - 2 ** -53`) into a list stores `0`. The same value in a map field is kept, and so are neighbouring values in a list (`0.9999999999999998`, `1.9999999999999998`, `-0.9999999999999999`, …). Assigning an array, `push` and `insertAt` are all affected, and the wrong value survives `save`/`load`.

```js
import * as A from "@automerge/automerge";

const doc = A.change(A.init(), (d) => {
  d.value = 0.9999999999999999;
  d.list = [0.9999999999999999];
});
doc.value;   // 0.9999999999999999
doc.list[0]; // 0
```

Reproduced with `@automerge/automerge` 3.5.0 (latest) and 3.4.1 on Node.js 24.16 (macOS, arm64), and in the browser through `automerge-repo` (Chromium). I found this issue when trying to save a normalised vector: a camera direction along +X becomes `[0.9999999999999999, -3e-16, 6e-17]` due to the imperfections of floating point math, but after the roundtrip through automerge, this comes back with an X-component of 0 and random, very small components for Y and Z.

This issue does not seem to occur for other numbers that are the largest below the next integer or for other values close to 0 or 1, it seems to only be this one exact value that's causing the issue.

## Run

```sh
npm install   # or: pnpm install
npm run repro
```

Output with `@automerge/automerge` 3.5.0 (latest) and 3.4.1:

```
ok   map field                            0.9999999999999999   expected 0.9999999999999999
FAIL list, assigned as an array           0                    expected 0.9999999999999999
FAIL list, push                           0                    expected 0.9999999999999999
FAIL list, insertAt                       0                    expected 0.9999999999999999
FAIL list, after save/load                0                    expected 0.9999999999999999

Neighbouring values in a list:
ok   0.9999999999999998                   0.9999999999999998   expected 0.9999999999999998
ok   1.9999999999999998                   1.9999999999999998   expected 1.9999999999999998
ok   -0.9999999999999999                  -0.9999999999999999  expected -0.9999999999999999
ok   0.49999999999999994                  0.49999999999999994  expected 0.49999999999999994

Largest double below other integers, in a list:
ok   2.9999999999999996                   2.9999999999999996   expected 2.9999999999999996
ok   3.9999999999999996                   3.9999999999999996   expected 3.9999999999999996
ok   9.999999999999998                    9.999999999999998    expected 9.999999999999998
ok   99.99999999999999                    99.99999999999999    expected 99.99999999999999
ok   2147483647.9999998                   2147483647.9999998   expected 2147483647.9999998
ok   4294967295.9999995                   4294967295.9999995   expected 4294967295.9999995
ok   4503599627370495.5                   4503599627370495.5   expected 4503599627370495.5

Other values near 0 and 1, in a list:
ok   1.0000000000000002                   1.0000000000000002   expected 1.0000000000000002
ok   0.5000000000000001                   0.5000000000000001   expected 0.5000000000000001
ok   0.1                                  0.1                  expected 0.1
ok   -0                                   -0                   expected -0
ok   5e-324                               5e-324               expected 5e-324

Large numbers, map field vs. list (not counted as failures):
same 9007199254740990        map 9007199254740990        list 9007199254740990
same 9007199254740991        map 9007199254740991n       list 9007199254740991n
same 9007199254740992        map 9007199254740992n       list 9007199254740992n
same 9223372036854776000     map 9223372036854775807n    list 9223372036854775807n
same 1e+21                   map 9223372036854775807n    list 9223372036854775807n
DIFF -9223372036854776000    map -9223372036854775808n   list -9223372036854776000
DIFF -1e+21                  map -9223372036854775808n   list -1e+21
```

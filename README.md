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

Reproduced with `@automerge/automerge` 3.5.0 (latest) and 3.4.1 on Node.js 24.16 (macOS, arm64), and in the browser through `automerge-repo` (Chromium). It shows up in practice for normalised vectors: a camera direction along +X is often `[0.9999999999999999, -3e-16, 6e-17]`, which comes back as nearly the zero vector.

## Run

```sh
npm install   # or: pnpm install
npm run repro
```

Output (exit code 1):

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
```

// Automerge stores 0.9999999999999999 (the largest double below 1) as 0 when it is inserted into a list.
// Exits with 1 while the bug is present.
import * as A from "@automerge/automerge";

const x = 0.9999999999999999;
let failed = false;
const fmt = (v) => (typeof v === "bigint" ? `${v}n` : Object.is(v, -0) ? "-0" : String(v));
const check = (label, actual, expected) => {
  const ok = Object.is(actual, expected);
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "FAIL"} ${label.padEnd(36)} ${fmt(actual).padEnd(20)} expected ${fmt(expected)}`);
};

const doc = A.change(A.init(), (d) => {
  d.value = x;
  d.assigned = [x];
  d.pushed = [];
  d.pushed.push(x);
  d.inserted = [];
  d.inserted.insertAt(0, x);
});
check("map field", doc.value, x);
check("list, assigned as an array", doc.assigned[0], x);
check("list, push", doc.pushed[0], x);
check("list, insertAt", doc.inserted[0], x);
check("list, after save/load", A.load(A.save(doc)).assigned[0], x);

const checkList = (values) => {
  const list = A.change(A.init(), (d) => (d.list = values)).list;
  values.forEach((v, i) => check(fmt(v), list[i], v));
};

console.log("\nNeighbouring values in a list:");
checkList([0.9999999999999998, 1.9999999999999998, -0.9999999999999999, 0.49999999999999994]);

// The next double below / above `n`.
const step = (n, dir) => {
  const f = new Float64Array([n]);
  new BigInt64Array(f.buffer)[0] += BigInt(Math.sign(n) * dir);
  return f[0];
};

console.log("\nLargest double below other integers, in a list:");
checkList([3, 4, 10, 100, 2 ** 31, 2 ** 32, 2 ** 52].map((n) => step(n, -1)));

console.log("\nOther values near 0 and 1, in a list:");
checkList([step(1, 1), step(0.5, 1), 0.1, -0, 5e-324]);

// Not counted towards the exit code: these are also changed in a map field.
console.log("\nLarge numbers, map field vs. list (not counted as failures):");
for (const v of [2 ** 53 - 2, 2 ** 53 - 1, 2 ** 53, 2 ** 63, 1e21, -(2 ** 63), -1e21]) {
  const d = A.change(A.init(), (d) => {
    d.value = v;
    d.list = [v];
  });
  const same = Object.is(d.value, d.list[0]) ? "same" : "DIFF";
  console.log(`${same} ${String(v).padEnd(23)} map ${fmt(d.value).padEnd(23)} list ${fmt(d.list[0])}`);
}

process.exit(failed ? 1 : 0);

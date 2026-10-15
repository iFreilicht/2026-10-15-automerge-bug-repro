// Automerge stores 0.9999999999999999 (the largest double below 1) as 0 when it is inserted into a list.
// Exits with 1 while the bug is present.
import * as A from "@automerge/automerge";

const x = 0.9999999999999999;
let failed = false;
const check = (label, actual, expected) => {
  const ok = Object.is(actual, expected);
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "FAIL"} ${label.padEnd(36)} ${String(actual).padEnd(20)} expected ${expected}`);
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

console.log("\nNeighbouring values in a list:");
const neighbours = [0.9999999999999998, 1.9999999999999998, -0.9999999999999999, 0.49999999999999994];
const list = A.change(A.init(), (d) => (d.list = neighbours)).list;
neighbours.forEach((v, i) => check(String(v), list[i], v));

process.exit(failed ? 1 : 0);

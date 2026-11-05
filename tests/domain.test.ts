import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, centsFromInput, daysBetween, formatDate, isIsoDate, leaseCovers, rangesOverlap, todayInTimeZone } from "../lib/domain.ts";

test("a lease covers the dates of its term", () => {
  const l = { start_date: "2026-01-01", end_date: "2026-12-31" };
  assert.equal(leaseCovers(l, "2025-12-31"), false);
  assert.equal(leaseCovers(l, "2026-01-01"), true);
  assert.equal(leaseCovers(l, "2026-12-31"), true);
  assert.equal(leaseCovers(l, "2027-01-01"), false);
});

test("date helpers", () => {
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2024-03-01", -1), "2024-02-29");
  assert.equal(daysBetween("2026-11-03", "2026-12-03"), 30);
  assert.ok(isIsoDate("2026-02-28"));
  assert.ok(!isIsoDate("2026-02-30"));
  assert.ok(!isIsoDate("02/01/2026"));
  assert.equal(todayInTimeZone("America/Los_Angeles", new Date("2026-11-03T05:00:00Z")), "2026-11-02");
  assert.equal(todayInTimeZone("America/New_York", new Date("2026-11-03T05:00:00Z")), "2026-11-03");
  assert.equal(formatDate("2026-11-03", "MM/DD/YYYY"), "11/03/2026");
  assert.equal(formatDate("2026-11-03", "MMM D, YYYY"), "Nov 3, 2026");
});

test("overlap detection is inclusive", () => {
  assert.ok(rangesOverlap("2026-01-01", "2026-12-31", "2026-12-31", "2027-12-31"));
  assert.ok(!rangesOverlap("2026-01-01", "2026-12-31", "2027-01-01", "2027-12-31"));
});

test("money parsing", () => {
  assert.equal(centsFromInput("1,850"), 185000);
  assert.equal(centsFromInput("$1850.5"), 185050);
  assert.equal(centsFromInput("12.345"), null);
  assert.equal(centsFromInput("-5"), null);
});


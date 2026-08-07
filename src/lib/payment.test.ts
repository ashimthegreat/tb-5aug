import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDaysIso,
  activePayments,
  paidTotal,
  remaining,
  hasDueDatePassed,
  paymentStatus,
  daysPastDue,
  agingBucket,
} from "./payment.ts";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const baseOrder = {
  total: 1000,
  payments: [],
};

test("addDaysIso adds days across month boundary", () => {
  assert.equal(addDaysIso("2026-08-28", 5), "2026-09-02");
  assert.equal(addDaysIso("2026-12-30", 5), "2027-01-04");
  assert.equal(addDaysIso("2026-08-07", 0), "2026-08-07");
});

test("addDaysIso returns input unchanged for invalid date", () => {
  assert.equal(addDaysIso("", 5), "");
  assert.equal(addDaysIso("not-a-date", 5), "not-a-date");
});

test("activePayments excludes voided payments", () => {
  const order = {
    payments: [
      { amount: 100, at: "", by: "", voided: true },
      { amount: 250, at: "", by: "" },
    ],
  };
  assert.equal(activePayments(order).length, 1);
});

test("paidTotal sums only active payments", () => {
  const order = {
    total: 1000,
    payments: [
      { amount: 100, at: "", by: "", voided: true },
      { amount: 250, at: "", by: "" },
      { amount: 50.5, at: "", by: "" },
    ],
  };
  assert.equal(paidTotal(order), 300.5);
});

test("paidTotal is zero when no payments", () => {
  assert.equal(paidTotal({ total: 1000, payments: [] }), 0);
  assert.equal(paidTotal({ total: 1000 }), 0);
});

test("remaining subtracts active payments", () => {
  assert.equal(remaining({ total: 1000, payments: [{ amount: 350, at: "", by: "" }] }), 650);
  assert.equal(remaining({ total: 100.33, payments: [{ amount: 100.11, at: "", by: "" }] }), 0.22);
  assert.equal(remaining({ total: 1000, payments: [] }), 1000);
});

test("hasDueDatePassed is true only after due date", () => {
  assert.equal(hasDueDatePassed({ paymentDueDate: "2020-01-01" }), true);
  assert.equal(hasDueDatePassed({ paymentDueDate: addDaysIso(todayIso(), 30) }), false);
  assert.equal(hasDueDatePassed({}), false);
});

test("paymentStatus received when fully paid", () => {
  assert.equal(paymentStatus({ total: 500, payments: [{ amount: 500, at: "", by: "" }] }), "received");
  assert.equal(paymentStatus({ total: 500, payments: [{ amount: 300, at: "", by: "" }, { amount: 200, at: "", by: "" }] }), "received");
});

test("paymentStatus partial when partly paid", () => {
  assert.equal(paymentStatus({ total: 500, payments: [{ amount: 200, at: "", by: "" }] }), "partial");
});

test("paymentStatus pending when unpaid and not due", () => {
  assert.equal(paymentStatus({ ...baseOrder, paymentDueDate: addDaysIso(todayIso(), 30) }), "pending");
  assert.equal(paymentStatus({ ...baseOrder }), "pending");
});

test("paymentStatus overdue when unpaid and due date passed", () => {
  assert.equal(paymentStatus({ ...baseOrder, paymentDueDate: addDaysIso(todayIso(), -10) }), "overdue");
});

test("paymentStatus ignores voided payments", () => {
  const order = {
    total: 500,
    payments: [{ amount: 500, at: "", by: "", voided: true }],
  };
  assert.equal(paymentStatus(order), "pending");
});

test("daysPastDue counts days past due, zero when not due or paid", () => {
  const due30 = addDaysIso(todayIso(), -30);
  assert.equal(daysPastDue({ ...baseOrder, paymentDueDate: due30 }), 30);
  assert.equal(daysPastDue({ ...baseOrder, paymentDueDate: addDaysIso(todayIso(), 5) }), 0);
  assert.equal(daysPastDue({ ...baseOrder }), 0);
  assert.equal(
    daysPastDue({ total: 500, payments: [{ amount: 500, at: "", by: "" }], paymentDueDate: due30 }),
    0
  );
});

test("agingBucket buckets by days past due", () => {
  assert.equal(agingBucket({ ...baseOrder, paymentDueDate: todayIso() }), "current");
  assert.equal(agingBucket({ ...baseOrder, paymentDueDate: addDaysIso(todayIso(), 1) }), "current");
  assert.equal(agingBucket({ ...baseOrder, paymentDueDate: addDaysIso(todayIso(), -2) }), "0-30");
  assert.equal(agingBucket({ ...baseOrder, paymentDueDate: addDaysIso(todayIso(), -10) }), "0-30");
  assert.equal(agingBucket({ ...baseOrder, paymentDueDate: addDaysIso(todayIso(), -30) }), "0-30");
  assert.equal(agingBucket({ ...baseOrder, paymentDueDate: addDaysIso(todayIso(), -31) }), "31-60");
  assert.equal(agingBucket({ ...baseOrder, paymentDueDate: addDaysIso(todayIso(), -60) }), "31-60");
  assert.equal(agingBucket({ ...baseOrder, paymentDueDate: addDaysIso(todayIso(), -61) }), "60+");
  assert.equal(agingBucket({ ...baseOrder }), "current");
  assert.equal(
    agingBucket({ total: 500, payments: [{ amount: 500, at: "", by: "" }], paymentDueDate: addDaysIso(todayIso(), -90) }),
    "current"
  );
});

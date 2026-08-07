import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clampInt,
  clampNumber,
  cleanPhone,
  isValidEmail,
  isValidPhone,
} from "./validation.ts";

test("isValidEmail accepts normal addresses", () => {
  assert.equal(isValidEmail("sales@techbucket.com.np"), true);
  assert.equal(isValidEmail("a.b+tag@example.co"), true);
});

test("isValidEmail rejects invalid addresses", () => {
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail("a@b"), false);
  assert.equal(isValidEmail("a..b@example.com"), false);
  assert.equal(isValidEmail("a@b@c.com"), false);
  assert.equal(isValidEmail("x@-bad.com"), false);
});

test("isValidPhone accepts valid numbers", () => {
  assert.equal(isValidPhone("98011223344"), true);
  assert.equal(isValidPhone("+977 98011223344"), true);
  assert.equal(isValidPhone("(01) 4411223"), true);
  assert.equal(isValidPhone("+977-98011223344"), true);
});

test("isValidPhone rejects invalid numbers", () => {
  assert.equal(isValidPhone(""), false);
  assert.equal(isValidPhone("123"), false);
  assert.equal(isValidPhone("abc123"), false);
  assert.equal(isValidPhone("980112233444444444"), false);
});

test("cleanPhone strips invalid characters", () => {
  assert.equal(cleanPhone("+977 98011223344!!"), "+977 98011223344");
  assert.equal(cleanPhone("98-0112 23344"), "98-0112 23344");
});

test("clampInt bounds values", () => {
  assert.equal(clampInt(0, 1, 1, 9999), 1);
  assert.equal(clampInt(5, 1, 1, 9999), 5);
  assert.equal(clampInt(20000, 1, 1, 9999), 9999);
  assert.equal(clampInt(Number.NaN, 1, 1, 9999), 1);
  assert.equal(clampInt(7.7, 1, 1, 9999), 8);
});

test("clampNumber bounds values", () => {
  assert.equal(clampNumber(-5, 0, 0, 100), 0);
  assert.equal(clampNumber(50, 0, 0, 100), 50);
  assert.equal(clampNumber(99999999, 0, 0, 100), 100);
  assert.equal(clampNumber(Number.NaN, 0, 0, 100), 0);
});

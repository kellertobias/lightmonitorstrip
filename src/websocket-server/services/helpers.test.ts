import { describe, test, expect } from "vitest";
import { getExecutorNumber, makeExecutorNumber } from "./helpers";

describe("getExecutorNumber", () => {
  test("first row executors", () => {
    expect(getExecutorNumber(0)).toBe(0);
    expect(getExecutorNumber(1)).toBe(1);
    expect(getExecutorNumber(9)).toBe(9);
    expect(getExecutorNumber(10)).toBe(10);
  });

  test("second row executors", () => {
    expect(getExecutorNumber(11)).toBe(1);
    expect(getExecutorNumber(12)).toBe(2);
    expect(getExecutorNumber(19)).toBe(9);
    expect(getExecutorNumber(20)).toBe(10);
  });

  test("next page executors", () => {
    expect(getExecutorNumber(21)).toBe(11);
    expect(getExecutorNumber(31)).toBe(11);
  });

  test("edge cases", () => {
    expect(getExecutorNumber(10)).toBe(10);
    expect(getExecutorNumber(30)).toBe(20);
    expect(getExecutorNumber(40)).toBe(20);
  });
});

describe("makeExecutorNumber", () => {
  test("first row executors", () => {
    expect(makeExecutorNumber(0)).toBe(0);
    expect(makeExecutorNumber(1)).toBe(1);
    expect(makeExecutorNumber(9)).toBe(9);
  });

  test("second row executors", () => {
    expect(makeExecutorNumber(10)).toBe(20);
    expect(makeExecutorNumber(11)).toBe(21);
    expect(makeExecutorNumber(19)).toBe(29);
  });

  test("third row executors", () => {
    expect(makeExecutorNumber(20)).toBe(40);
    expect(makeExecutorNumber(21)).toBe(41);
    expect(makeExecutorNumber(29)).toBe(49);
  });

  test("edge cases", () => {
    expect(makeExecutorNumber(99)).toBe(199);
    expect(makeExecutorNumber(100)).toBe(200);
  });
});

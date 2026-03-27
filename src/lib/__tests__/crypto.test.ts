import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../crypto";

describe("encrypt/decrypt", () => {
  it("roundtrips a short string", () => {
    const original = "sk-test-key-123";
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(":"); // iv:ciphertext:tag format
    expect(decrypt(encrypted)).toBe(original);
  });

  it("roundtrips a long API key", () => {
    const original = "sk-ant-api03-very-long-key-with-many-characters-1234567890abcdef";
    const encrypted = encrypt(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  it("produces different ciphertexts for same input (random IV)", () => {
    const original = "same-key";
    const enc1 = encrypt(original);
    const enc2 = encrypt(original);
    expect(enc1).not.toBe(enc2); // different IVs
    expect(decrypt(enc1)).toBe(original);
    expect(decrypt(enc2)).toBe(original);
  });

  it("handles unencrypted (legacy) values gracefully", () => {
    // decrypt should return plain text that doesn't have the iv:cipher:tag format
    const legacy = "AIzaSyPlainTextKey";
    expect(decrypt(legacy)).toBe(legacy);
  });
});

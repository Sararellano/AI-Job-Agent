import { describe, expect, it } from "vitest";
import { buildDocumentFilename } from "./document-filename";

describe("buildDocumentFilename", () => {
  it("uses person name, document type and company", () => {
    expect(
      buildDocumentFilename("cv", { fullName: "Sara Rellano" }, "Acme Corp")
    ).toBe("Sara_Rellano_CV_Acme_Corp");
  });

  it("falls back to default when company is empty", () => {
    expect(
      buildDocumentFilename("cover_letter", { fullName: "John Doe" }, "  ")
    ).toBe("John_Doe_Cover_Letter_default");
  });

  it("sanitizes accents and special characters", () => {
    expect(
      buildDocumentFilename("cv", { fullName: "José García" }, "Café & Co.")
    ).toBe("Jose_Garcia_CV_Cafe_Co");
  });
});

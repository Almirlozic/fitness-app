import { describe, expect, it } from "vitest";
import { emailSchema, isAdminEmail, parseAdminEmails, setPasswordSchema } from "./auth-schemas";

describe("setPasswordSchema", () => {
  it("kræver mindst 8 tegn", () => {
    const r = setPasswordSchema.safeParse({ password: "kort", confirm: "kort" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Adgangskoden skal være mindst 8 tegn");
  });

  it("kræver at de to felter matcher", () => {
    const r = setPasswordSchema.safeParse({ password: "langkode1", confirm: "langkode2" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]).toMatchObject({ path: ["confirm"], message: "Adgangskoderne er ikke ens" });
  });

  it("godkender en gyldig adgangskode", () => {
    expect(setPasswordSchema.safeParse({ password: "langkode1", confirm: "langkode1" }).success).toBe(true);
  });
});

describe("emailSchema", () => {
  it("trimmer og gør små bogstaver", () => {
    expect(emailSchema.parse("  Navn@Mail.DK ")).toBe("navn@mail.dk");
  });

  it("afviser ugyldige e-mails", () => {
    expect(emailSchema.safeParse("ikke-en-mail").success).toBe(false);
  });
});

describe("admin", () => {
  it("læser ADMIN_EMAILS kommasepareret", () => {
    expect(parseAdminEmails(" a@b.dk, C@D.dk ,")).toEqual(["a@b.dk", "c@d.dk"]);
    expect(parseAdminEmails(undefined)).toEqual([]);
  });

  it("matcher uden forskel på store/små bogstaver", () => {
    expect(isAdminEmail("A@B.dk", "a@b.dk,x@y.dk")).toBe(true);
    expect(isAdminEmail("z@b.dk", "a@b.dk")).toBe(false);
    expect(isAdminEmail(undefined, "a@b.dk")).toBe(false);
    expect(isAdminEmail("a@b.dk", "")).toBe(false);
  });
});

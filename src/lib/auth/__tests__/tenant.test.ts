import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindFirst, mockCreate, mockUserFindUnique, mockUserUpdate } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    organization: {
      findFirst: mockFindFirst,
      create: mockCreate,
    },
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
  },
}));

import { ensureUserOrganization, findOrCreateOrganization, getEmailDomain, slugify } from "@/lib/auth/tenant";

// ── getEmailDomain ───────────────────────────────────────────────────────────

describe("getEmailDomain", () => {
  it("extrait le domaine d'une adresse email standard", () => {
    expect(getEmailDomain("user@example.com")).toBe("example.com");
  });

  it("retourne l'email entier si aucun @ trouvé", () => {
    expect(getEmailDomain("pasdearobase")).toBe("pasdearobase");
  });

  it("gère les sous-domaines", () => {
    expect(getEmailDomain("alice@mail.company.io")).toBe("mail.company.io");
  });

  it("utilise le dernier segment après @", () => {
    expect(getEmailDomain("a@b@c.com")).toBe("b@c.com");
  });
});

// ── slugify ──────────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("met en minuscules", () => {
    expect(slugify("EXAMPLE.COM")).toBe("example-com");
  });

  it("remplace les points par des tirets", () => {
    expect(slugify("mail.example.com")).toBe("mail-example-com");
  });

  it("préserve les tirets existants", () => {
    expect(slugify("my-company.com")).toBe("my-company-com");
  });

  it("remplace les caractères spéciaux", () => {
    expect(slugify("a_b+c.com")).toBe("a-b-c-com");
  });
});

// ── findOrCreateOrganization ─────────────────────────────────────────────────

describe("findOrCreateOrganization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne l'organisation existante si le slug est trouvé", async () => {
    const existing = { id: "org-1", name: "example.com", slug: "example-com" };
    mockFindFirst.mockResolvedValueOnce(existing);

    const result = await findOrCreateOrganization("user@example.com");

    expect(mockFindFirst).toHaveBeenCalledWith({ where: { slug: "example-com" } });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });

  it("crée une nouvelle organisation si aucune trouvée", async () => {
    const created = { id: "org-2", name: "newcorp.io", slug: "newcorp-io" };
    mockFindFirst.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce(created);

    const result = await findOrCreateOrganization("bob@newcorp.io");

    expect(mockCreate).toHaveBeenCalledWith({
      data: { name: "newcorp.io", slug: "newcorp-io" },
    });
    expect(result).toBe(created);
  });

  it("dérive le slug du domaine email", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({ id: "org-3", name: "acme.fr", slug: "acme-fr" });

    await findOrCreateOrganization("charlie@acme.fr");

    expect(mockFindFirst).toHaveBeenCalledWith({ where: { slug: "acme-fr" } });
  });

  it("appelle findFirst avant create", async () => {
    const calls: string[] = [];
    mockFindFirst.mockImplementationOnce(() => { calls.push("findFirst"); return Promise.resolve(null); });
    mockCreate.mockImplementationOnce(() => { calls.push("create"); return Promise.resolve({ id: "x" }); });

    await findOrCreateOrganization("d@z.com");

    expect(calls).toEqual(["findFirst", "create"]);
  });
});

// ── ensureUserOrganization ────────────────────────────────────────────────────

describe("ensureUserOrganization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne l'organizationId existant sans requête supplémentaire", async () => {
    mockUserFindUnique.mockResolvedValueOnce({ organizationId: "org-existing" });

    const result = await ensureUserOrganization("user-1", "user@example.com");

    expect(result).toBe("org-existing");
    expect(mockFindFirst).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("crée l'organisation et met à jour l'utilisateur si organizationId est null", async () => {
    mockUserFindUnique.mockResolvedValueOnce({ organizationId: null });
    mockFindFirst.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({ id: "org-new", name: "example.com", slug: "example-com" });
    mockUserUpdate.mockResolvedValueOnce({});

    const result = await ensureUserOrganization("user-1", "user@example.com");

    expect(result).toBe("org-new");
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { organizationId: "org-new" },
    });
  });

  it("provisionne même si l'utilisateur n'existe pas en base (findUnique retourne null)", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockFindFirst.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({ id: "org-3", name: "test.io", slug: "test-io" });
    mockUserUpdate.mockResolvedValueOnce({});

    const result = await ensureUserOrganization("user-2", "x@test.io");

    expect(result).toBe("org-3");
  });

  it("réutilise l'organisation existante sans créer de doublon", async () => {
    const existingOrg = { id: "org-found", name: "corp.com", slug: "corp-com" };
    mockUserFindUnique.mockResolvedValueOnce({ organizationId: null });
    mockFindFirst.mockResolvedValueOnce(existingOrg);
    mockUserUpdate.mockResolvedValueOnce({});

    const result = await ensureUserOrganization("user-3", "bob@corp.com");

    expect(result).toBe("org-found");
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

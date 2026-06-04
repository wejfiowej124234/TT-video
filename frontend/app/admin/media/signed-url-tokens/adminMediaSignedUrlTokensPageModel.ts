import { isUuidString } from "@/lib/isUuidString";

export type SignedUrlTokenRow = {
  id?: string;
  object_id?: string;
  url_scope?: string;
  expires_at?: string;
  issued_to?: string;
  created_at?: string;
};

export type SignedUrlTokensRes = {
  status?: string;
  error?: string;
  items?: SignedUrlTokenRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const OBJECT_MAX = 256;
export const SCOPE_URL = new Set(["read", "download"]);

export function parseSignedUrlTokensQuery(sp: URLSearchParams): {
  limit: number;
  objectId: string;
  urlScope: string;
  issuedTo: string;
  tokenId: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const objectId = (sp.get("object_id") ?? "").trim().slice(0, OBJECT_MAX);
  const rawScope = (sp.get("url_scope") ?? "").trim().toLowerCase();
  const urlScope = SCOPE_URL.has(rawScope) ? rawScope : "";
  const rawIssued = (sp.get("issued_to") ?? "").trim();
  const issuedTo = isUuidString(rawIssued) ? rawIssued : "";
  const rawTok = (sp.get("token_id") ?? "").trim();
  const tokenId = isUuidString(rawTok) ? rawTok : "";
  return { limit, objectId, urlScope, issuedTo, tokenId };
}

export function buildSignedUrlTokensListPath(q: {
  limit: number;
  objectId: string;
  urlScope: string;
  issuedTo: string;
  tokenId: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const oid = q.objectId.trim().slice(0, OBJECT_MAX);
  if (oid) sp.set("object_id", oid);
  if (SCOPE_URL.has(q.urlScope)) sp.set("url_scope", q.urlScope);
  if (q.issuedTo && isUuidString(q.issuedTo)) sp.set("issued_to", q.issuedTo.trim());
  if (q.tokenId && isUuidString(q.tokenId)) sp.set("token_id", q.tokenId.trim());
  return `/admin/media/signed-url-tokens?${sp.toString()}`;
}

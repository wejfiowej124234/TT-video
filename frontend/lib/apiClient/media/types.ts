export type MediaSignedUrlScope = "read" | "download";

export type PostMediaSignedUrlsBody = {
  object_id: string;
  scope: MediaSignedUrlScope;
  expires_in?: number;
};

export type PostMediaSignedUrlsResult = {
  status?: string;
  url?: string;
  expires_at?: string;
  token_id?: string;
};

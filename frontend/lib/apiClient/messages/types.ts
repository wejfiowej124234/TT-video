export type OrderMessageRow = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_avatar_url?: string | null;
  sender_name?: string | null;
};

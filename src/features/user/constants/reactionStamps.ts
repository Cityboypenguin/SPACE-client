// Definitions are loaded from the server; unknown historical IDs have a neutral fallback.
export type ReactionStamp = {
  id: string;
  label: string;
  imageUrl: string;
  displaySize: string;
  status: string;
  allowMessage: boolean;
  allowReaction: boolean;
  messageOrder: number;
  reactionOrder: number;
  version: number;
};
let stamps = new Map<string, ReactionStamp>();
export const setStampDefinitions = (values: ReactionStamp[]) => {
  stamps = new Map(values.map((s) => [s.id, s]));
};
export const isStampReaction = (id: string) => id.startsWith('stamp:');
export const findStamp = (id: string) => stamps.get(id);
export const reactionLabel = (id: string) =>
  isStampReaction(id) ? (findStamp(id)?.label ?? 'スタンプ') : id;

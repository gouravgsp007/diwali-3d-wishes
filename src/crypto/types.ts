import type { OccasionId } from '../themes/experience-theme.interface';

export interface GreetingPayload {
  recipient: string;
  sender: string;
  message: string;
  templateId?: OccasionId | string;
  createdAt?: number;
  musicTheme?: string;
  customMusicUrl?: string;
}

export function isValidGreetingPayload(obj: unknown): obj is GreetingPayload {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.recipient === 'string' &&
    typeof candidate.sender === 'string' &&
    typeof candidate.message === 'string'
  );
}

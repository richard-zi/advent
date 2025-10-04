export type ContentType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'gif'
  | 'poll'
  | 'puzzle'
  | 'countdown'
  | 'iframe'
  | 'not available yet';

export interface DoorContent {
  day?: number; // Added for frontend usage
  data: string | null;
  type: ContentType;
  text: string | null;
  thumbnail: string | null;
  isSolved?: boolean;
}

export interface MediaContent {
  type: ContentType;
  data?: string;
}

export interface PollData {
  question: string;
  options: string[];
}

export interface PollVotes {
  [option: string]: number;
}

export interface PollVoteRecord {
  votes: PollVotes;
  voters: {
    [userId: string]: string; // userId -> option
  };
}

export interface MediumData {
  [key: string]: string;
}

export interface DoorStates {
  [doorNumber: number]: {
    win?: boolean;
    [key: string]: unknown;
  };
}

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface Track {
  id: string;
  title: string;
  username?: string;
  coverImage?: {
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  };
  audioFile?: {
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  };
  samples?: Array<{
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  }>;
  genres?: string[] | string;
  bpm?: number;
  key?: string;
  description?: string;
  trackStatus?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
  users_permissions_user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface TrackResponse {
  data: Track;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface TracksResponse {
  data: Track[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

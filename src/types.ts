export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
  chords: string;
  tags: Tag[];
  video_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  color: string;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  phone: string;
  roles: Role[];
  created_at: string;
  updated_at: string;
}

export interface ScheduleAssignment {
  id?: string;
  schedule_id: string;
  member_id: string;
  role_name: string;
  member?: Member;
}

export interface Schedule {
  id: string;
  date: string;
  title: string;
  assignments: ScheduleAssignment[];
  created_at: string;
  updated_at: string;
}

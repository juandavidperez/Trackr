export interface ProjectRequest {
  name: string;
  description?: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  createdAt: string;
}

export interface AddMemberRequest {
  email: string;
}

export interface ProjectMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

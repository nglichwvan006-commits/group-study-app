export enum Role {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
}

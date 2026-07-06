import { IsEmail, IsEnum, IsString } from "class-validator";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  BUSINESS_OWNER = "BUSINESS_OWNER",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
  CUSTOMER = "CUSTOMER"
}

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsEnum(Role)
  role!: Role;
}

export class UpdateMemberRoleDto {
  @IsEnum(Role)
  role!: Role;
}

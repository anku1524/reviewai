import { IsOptional, IsString } from "class-validator";

export class CreateBusinessDto {
  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class SubmitRatingDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  stars: number;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsString()
  @IsOptional()
  keywords?: string;

  @IsString()
  @IsOptional()
  tone?: string;
}

export class RegenerateDraftDto {
  @IsString()
  @IsOptional()
  keywords?: string;

  @IsString()
  @IsNotEmpty()
  tone: string;
}

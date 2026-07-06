import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CampaignCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  channel: string; // EMAIL | SMS | WHATSAPP

  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignCustomerDto)
  customers: CampaignCustomerDto[];
}

import { Controller, Get, Param } from "@nestjs/common";
import { LocationsService } from "./locations.service";

@Controller("public/locations")
export class PublicLocationsController {
  constructor(private locationsService: LocationsService) {}

  @Get(":id")
  findOnePublic(@Param("id") id: string) {
    return this.locationsService.findOnePublic(id);
  }
}

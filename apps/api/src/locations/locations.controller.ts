import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { LocationsService } from "./locations.service";
import { CreateLocationDto, UpdateLocationDto } from "./dto/location.dto";

@UseGuards(JwtAuthGuard)
@Controller("businesses/:businessId/locations")
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Post()
  create(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateLocationDto,
  ) {
    return this.locationsService.create(businessId, user.userId, dto);
  }

  @Get()
  findAll(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.locationsService.findAll(businessId, user.userId);
  }

  @Patch(":locationId")
  update(
    @Param("locationId") locationId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(locationId, user.userId, dto);
  }

  @Delete(":locationId")
  remove(
    @Param("locationId") locationId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.locationsService.remove(locationId, user.userId);
  }
}

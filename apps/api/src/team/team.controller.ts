import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { TeamService } from "./team.service";
import { InviteMemberDto, UpdateMemberRoleDto } from "./dto/team.dto";

@UseGuards(JwtAuthGuard)
@Controller("businesses/:businessId/team")
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Post()
  invite(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: InviteMemberDto,
  ) {
    return this.teamService.invite(businessId, user.userId, dto);
  }

  @Get()
  findAll(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.teamService.findAll(businessId, user.userId);
  }

  @Patch(":memberId/role")
  updateRole(
    @Param("memberId") memberId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.teamService.updateRole(memberId, user.userId, dto);
  }

  @Delete(":memberId")
  remove(
    @Param("memberId") memberId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.teamService.remove(memberId, user.userId);
  }
}

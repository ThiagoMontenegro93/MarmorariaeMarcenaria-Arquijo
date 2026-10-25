import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Publico } from '../../common/decorators/publico.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/** Health check para Docker/Railway/Render e monitoramento externo (uptime). */
@ApiTags('saude')
@Publico()
@SkipThrottle()
@Controller('saude')
export class SaudeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async verificar() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', banco: 'ok', horario: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException({ status: 'erro', banco: 'indisponível' });
    }
  }
}

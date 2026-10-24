import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Perfis } from '../../common/decorators/perfis.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Perfis('GESTOR')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /** Tudo de uma vez (uma chamada para a tela inicial). */
  @Get()
  resumo() {
    return this.dashboard.resumo();
  }

  @Get('kpis')
  kpis() {
    return this.dashboard.kpis();
  }

  @Get('funil')
  funil() {
    return this.dashboard.funil();
  }

  @Get('fluxo-caixa')
  fluxoCaixa() {
    return this.dashboard.fluxoCaixa();
  }

  @Get('atencao-hoje')
  atencaoHoje() {
    return this.dashboard.atencaoHoje();
  }
}

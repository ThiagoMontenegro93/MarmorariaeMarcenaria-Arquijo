import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './common/audit/audit.module';
import { ErroCalculoFilter } from './common/filters/erro-calculo.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PerfisGuard } from './common/guards/perfis.guard';
import { validarAmbiente } from './config/env';
import { AuthModule } from './modulos/auth/auth.module';
import { CatalogoModule } from './modulos/catalogo/catalogo.module';
import { ChapasModule } from './modulos/chapas/chapas.module';
import { ClientesModule } from './modulos/clientes/clientes.module';
import { DashboardModule } from './modulos/dashboard/dashboard.module';
import { LeadsB2BModule } from './modulos/leads-b2b/leads-b2b.module';
import { OrdensServicoModule } from './modulos/ordens-servico/ordens-servico.module';
import { PagamentosModule } from './modulos/pagamentos/pagamentos.module';
import { ProjetosModule } from './modulos/projetos/projetos.module';
import { SaudeModule } from './modulos/saude/saude.module';
import { WhatsappModule } from './modulos/whatsapp/whatsapp.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente }),
    // Limite global padrão: 120 requisições/min por IP; rotas sensíveis têm limites próprios.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '8h', issuer: 'arquijo-api' },
        verifyOptions: { issuer: 'arquijo-api' },
      }),
    }),
    PrismaModule,
    AuditModule,
    SaudeModule,
    AuthModule,
    ClientesModule,
    ChapasModule,
    ProjetosModule,
    OrdensServicoModule,
    PagamentosModule,
    CatalogoModule,
    LeadsB2BModule,
    DashboardModule,
    WhatsappModule,
  ],
  providers: [
    // Ordem importa: rate limit → autenticação → autorização por perfil.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PerfisGuard },
    { provide: APP_FILTER, useClass: ErroCalculoFilter },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappController } from './whatsapp.controller';
import { BusinessApiProvider, LinkWaMeProvider, WHATSAPP_PROVIDER } from './whatsapp.provider';
import { WhatsappService } from './whatsapp.service';

@Module({
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    {
      // Troca de provedor só por variável de ambiente (WHATSAPP_PROVIDER=link | business_api).
      provide: WHATSAPP_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get('WHATSAPP_PROVIDER') === 'business_api'
          ? new BusinessApiProvider(config.get('WHATSAPP_API_TOKEN'), config.get('WHATSAPP_PHONE_NUMBER_ID'))
          : new LinkWaMeProvider(),
    },
  ],
  exports: [WhatsappService],
})
export class WhatsappModule {}

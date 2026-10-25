import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ARMAZENAMENTO, ArmazenamentoLocal, ArmazenamentoS3 } from './armazenamento';

@Global()
@Module({
  providers: [
    {
      provide: ARMAZENAMENTO,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get('STORAGE_PROVIDER') === 's3' ? new ArmazenamentoS3(config.get('S3_BUCKET')) : new ArmazenamentoLocal(config.get('UPLOAD_DIR') ?? './uploads'),
    },
  ],
  exports: [ARMAZENAMENTO],
})
export class ArmazenamentoModule {}

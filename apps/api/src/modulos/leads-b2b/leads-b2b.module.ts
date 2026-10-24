import { Module } from '@nestjs/common';
import { LeadsB2BController } from './leads-b2b.controller';
import { LeadsB2BService } from './leads-b2b.service';

@Module({ controllers: [LeadsB2BController], providers: [LeadsB2BService] })
export class LeadsB2BModule {}

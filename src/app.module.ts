import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TwitterModule } from './twitter/twitter.module';
import { ContentGeneratorModule } from './content-generator/content-generator.module';
import { ContentApprovalModule } from './content-approval/content-approval.module';
import { DbModule } from './db/db.module';
import { TasksModule } from './tasks/tasks.module';
import { ConfigModule as AppConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TwitterModule,
    ContentGeneratorModule,
    ContentApprovalModule,
    DbModule,
    TasksModule,
    AppConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

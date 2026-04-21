import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TokensModule } from './tokens/tokens.module';
import { OtpModule } from './otp/otp.module';
import { MailerModule } from './mailer/mailer.module';
import { RedisModule } from './redis/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { CatalogModule } from './catalog/catalog.module';
import { LearningModule } from './learning/learning.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { EngagementModule } from './engagement/engagement.module';
import { LabsModule } from './labs/labs.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ContentModule } from './content/content.module';
import { ProfileModule } from './profile/profile.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { ThrottlerModule } from '@nestjs/throttler';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import oauthConfig from './config/oauth.config';
import brevoConfig from './config/brevo.config';
import { configValidationSchema } from './config/config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig, oauthConfig, brevoConfig],
      validationSchema: configValidationSchema,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    RedisModule,
    MailerModule,
    UsersModule,
    TokensModule,
    OtpModule,
    AuthModule,
    AiChatModule,
    CatalogModule,
    LearningModule,
    AssessmentsModule,
    EngagementModule,
    LabsModule,
    AnalyticsModule,
    ContentModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
  ],
})
export class AppModule {}

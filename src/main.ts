import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

export async function createNestApp() {
  const app = await NestFactory.create(AppModule);

  // Temporarily open to every origin: reflecting the request origin is the only way
  // to allow all origins while keeping credentials (cookies) working.
  // Restore an allowlist (FRONTEND_URL) before going to production.
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-User-Id',
      'X-User-Role',
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 204,
  });

  // Global Prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');

  // Security
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Swagger (only in non-prod)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ATP Auth Service')
      .setDescription('Auth Service for AI Teaching Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication')
      .addTag('Health')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  return app;
}

async function bootstrap() {
  if (!process.env.VERCEL) {
    const app = await createNestApp();
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log("\n\n\nThis is a modified log for success\n\n\n")
    console.log(`Application is running on: http://localhost:${port}`);
  }
}

if (require.main === module) {
  bootstrap();
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

export async function createNestApp() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const frontendUrl = process.env.FRONTEND_URL;
  const origins = ['http://localhost:3000', 'http://localhost:3001'];
  if (frontendUrl) origins.push(frontendUrl);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: '*',
    allowedHeaders: '*',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global Prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');

  // Security
  app.use(helmet());

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
    console.log(`Application is running on: http://localhost:${port}`);
  }
}

if (require.main === module) {
  bootstrap();
}

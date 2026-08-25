import { NestFactory }     from '@nestjs/core';
import { ValidationPipe }  from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule }       from './app.module';

async function bootstrap() {
  // Express adapter required — socket.io WebSocket gateway is incompatible with Fastify
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS' });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('AgentBazaar API')
    .setDescription('Permissionless AI Agent Marketplace on MultiversX')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`\nAgentBazaar API  →  http://localhost:${port}/api/v1`);
  console.log(`Swagger docs      →  http://localhost:${port}/api/docs`);
  console.log(`WebSocket stream  →  ws://localhost:${port}/events\n`);
}

bootstrap();

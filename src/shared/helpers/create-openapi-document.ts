import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Starter API DOC')
    .setDescription('The starter API documentation')
    .setOpenAPIVersion('3.1.0')
    .build();

  return SwaggerModule.createDocument(app, config);
}

import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import logger from '@repo/infra/logger';

import XmlBodyParser from '@api/plugins/xmlBodyParser';
import router from '@api/routes';
import buildXml from './util/buildXml';
import statusCode from './util/statusCode';

const server: FastifyInstance = fastify();

function errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply) {
  return reply.code(statusCode.BAD_REQUEST).headers({
    "content-type": "application/problem+xml"
  }).send(buildXml({
    problem: {
      "@xmlns": "urn:ietf:rfc:7807",
      type: "https://dict.pi.rsfn.net.br/api/v2/error/EntryInvalid",
      title: "Entry is invalid",
      status: statusCode.BAD_REQUEST,
      detail: "Entry has invalid fields",
      violations: [
        {
          violation: {
            reason: "Entry has invalid body",
            value: `${error.message.replace('Invalid Format:', '').replace(/'/g, '')}`,
            property: "entry"
          }
        }
      ]
    }
  }))
}

server.setErrorHandler(errorHandler);

server.register(XmlBodyParser(true));

server.register(router, { prefix: 'api' });

const server_port: number = Number(process.env.PORT) || 8080;

server.listen({ host: '0.0.0.0', port: server_port }, (err, address) => {
  if (err) {
    logger.error(err);
    process.exit(1);
  }
  logger.log(`Server listening at ${address}`);
  logger.log(`\n`, server.printRoutes());
})
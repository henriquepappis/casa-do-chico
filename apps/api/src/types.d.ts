import "@fastify/jwt";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; username: string; role: string };
    user: { id: string; username: string; role: string };
  }
}

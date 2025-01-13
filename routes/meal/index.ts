import { FastifyInstance } from 'fastify';

async function meals(fastify: FastifyInstance) {
  // GET all products
  fastify.get('/meals', async (request, reply) => {
    return { message: 'List of products' };
  });
}


export default meals;
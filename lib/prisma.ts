BigInt.prototype.toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export { prisma }
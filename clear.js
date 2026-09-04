const { PrismaClient } = require('./app/generated/prisma');
const prisma = new PrismaClient();
prisma.stream.deleteMany({}).then(() => console.log('cleared')).catch(console.error).finally(() => prisma.$disconnect());

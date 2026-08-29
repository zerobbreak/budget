import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { getDatabaseUrl } from '../src/database-url.js'

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: getDatabaseUrl(),
      connectionTimeoutMillis: 10_000,
    }),
  ),
})

async function main() {
  console.log('Seeding database...')

  await prisma.transaction.deleteMany()
  await prisma.category.deleteMany()
  await prisma.account.deleteMany()

  const savings = await prisma.account.create({
    data: { name: 'Savings' },
  })

  const cheque = await prisma.account.create({
    data: { name: 'Cheque' },
  })

  const income = await prisma.category.create({
    data: { name: 'Income', type: 'INCOME' },
  })

  const transport = await prisma.category.create({
    data: { name: 'Transport', type: 'EXPENSE' },
  })

  const bills = await prisma.category.create({
    data: { name: 'Bills', type: 'EXPENSE' },
  })

  const food = await prisma.category.create({
    data: { name: 'Food', type: 'EXPENSE' },
  })

  const now = new Date()

  await prisma.transaction.createMany({
    data: [
      {
        name: 'Freelance',
        amount: 5400,
        type: 'INCOME',
        accountId: savings.id,
        categoryId: income.id,
        occurredAt: now,
      },
      {
        name: 'Bonus',
        amount: 9000,
        type: 'INCOME',
        accountId: cheque.id,
        categoryId: income.id,
        occurredAt: now,
      },
      {
        name: 'Uber',
        amount: 320,
        type: 'EXPENSE',
        accountId: cheque.id,
        categoryId: transport.id,
        occurredAt: now,
      },
      {
        name: 'Gym',
        amount: 720,
        type: 'EXPENSE',
        accountId: cheque.id,
        categoryId: bills.id,
        occurredAt: now,
      },
      {
        name: 'Coffee',
        amount: 90,
        type: 'EXPENSE',
        accountId: cheque.id,
        categoryId: food.id,
        occurredAt: now,
      },
    ],
  })

  console.log('Seeded accounts, categories, and transactions')
}

main()
  .catch((error) => {
    console.error('Error seeding database:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

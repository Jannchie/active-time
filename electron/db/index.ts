import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function listMinutelyRecords (duration: number) {
  return prisma.minutelyRecord.findMany({})
}

export async function insertRawRecord (record: any) {
  return prisma.rawRecord.create({ data: record })
}

export async function listRawRecords (duration: number) {
  return prisma.rawRecord.findMany({})
}

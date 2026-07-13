import mongoose from 'mongoose'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

async function main() {
  await mongoose.connect(databaseUrl as string, { bufferCommands: false })
  console.log('MongoDB connected successfully.')
  await mongoose.disconnect()
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error('MongoDB connection failed:', error)
  process.exit(1)
})

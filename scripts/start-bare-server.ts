import { startBareServer } from '../lib/bare-server'

async function main() {
  try {
    await startBareServer()
    console.log('Bare server started successfully')
  } catch (error) {
    console.error('Failed to start bare server:', error)
    process.exit(1)
  }
}

main() 
import bcrypt from "bcrypt"

async function generateHash() {
  const password = "Admin123!"
  const hashedPassword = await bcrypt.hash(password, 10)
  console.log("Hashed password:", hashedPassword)
}

generateHash() 
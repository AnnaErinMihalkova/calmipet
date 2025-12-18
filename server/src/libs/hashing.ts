import bcrypt from 'bcryptjs'

export const hash = async (value: string) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(value, salt)
}

export const compare = async (value: string, hashed: string) => bcrypt.compare(value, hashed)
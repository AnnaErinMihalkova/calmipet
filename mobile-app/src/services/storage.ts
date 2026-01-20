import AsyncStorage from '@react-native-async-storage/async-storage'

const ACCESS_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await AsyncStorage.multiSet([[ACCESS_KEY, accessToken], [REFRESH_KEY, refreshToken]])
}

export const getTokens = async () => {
  const [[, access], [, refresh]] = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY])
  return { accessToken: access || '', refreshToken: refresh || '' }
}

export const clearTokens = async () => {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY])
}
const ANIMAL_KEY = 'preferredAnimal'
export const getPreferredAnimal = async () => {
  const v = await AsyncStorage.getItem(ANIMAL_KEY)
  return v || 'raccoon'
}
export const setPreferredAnimal = async (animal: string) => {
  await AsyncStorage.setItem(ANIMAL_KEY, animal)
}

const USER_INFO_KEY = 'hb_user_info'
export const getUserInfo = async (): Promise<any | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_INFO_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
export const setUserInfo = async (info: any) => {
  try {
    await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  } catch {}
}

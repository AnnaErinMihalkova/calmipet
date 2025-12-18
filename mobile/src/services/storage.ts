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
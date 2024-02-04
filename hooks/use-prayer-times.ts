import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'

export enum Prayer {
  Fajr = 'Fajr',
  Dhuhr = 'Dhuhr',
  Asr = 'Asr',
  Maghrib = 'Maghrib',
  Isha = 'Isha',
}

export interface Item {
  id: number
  title: Prayer
  checked: boolean
  time: string
  date: string
}

const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const PRAYER_TIME_STORAGE_KEY = 'prayer_times_cache'
const TIMESTAMP_STORAGE_KEY = 'prayer_times_timestamp'

export const usePrayerTimes = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [prayers, setPrayers] = useState<Item[]>([])
  const [currentDay, setCurrentDay] = useState<Date>(new Date())

  const fetchPrayerTimes = async (latitude?: number, longitude?: number, date?: Date) => {
    const dateString = date?.toISOString().split('T')[0]
    const cacheKey = `${dateString}_${latitude}_${longitude}`
    const checkedItemskey = `checked_prayers`

    try {
      const cachedData = await AsyncStorage.getItem(PRAYER_TIME_STORAGE_KEY)
      const cachedPrayerTimes = JSON.parse(cachedData || '{}')

      const cachedTimestamp = await AsyncStorage.getItem(TIMESTAMP_STORAGE_KEY)
      const lastUpdated = cachedTimestamp ? new Date(cachedTimestamp) : null

      const TimeZone = 'Europe/Helsinki'

      const isDateStale =
        !lastUpdated || // No timestamp available
        (lastUpdated && Date.now() - lastUpdated.getTime() > CACHE_EXPIRATION_TIME)

      if (cachedPrayerTimes[cacheKey] && !isDateStale) {
        setPrayers(cachedPrayerTimes[cacheKey])
        return
      }

      const response = await fetch(
        `http://api.aladhan.com/v1/timings/${dateString}?latitude=${latitude}&longitude=${longitude}&method=2&timezonestring=${TimeZone}`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch prayer times')
      }

      const data = await response.json()

      const prayerTimes = data.data.timings

      const newPrayers: Item[] = Object.values(Prayer).map((title, index) => ({
        id: index + 1,
        title,
        checked: false,
        time: prayerTimes[title] || '',
        date: dateString || '',
      }))

      const updatedCachedData = { ...cachedPrayerTimes, [cacheKey]: newPrayers }
      await AsyncStorage.setItem(PRAYER_TIME_STORAGE_KEY, JSON.stringify(updatedCachedData))

      await AsyncStorage.setItem(TIMESTAMP_STORAGE_KEY, new Date().toISOString())

      setPrayers(newPrayers)

      const checkedItems = await AsyncStorage.getItem(checkedItemskey)

      if (checkedItems) {
        const checkedItemsMap = JSON.parse(checkedItems)
        const updatedPrayers = prayers.map((prayer) => ({
          ...prayer,
          checked: !!checkedItemsMap[prayer.id],
        }))
        setPrayers(updatedPrayers)
      }
    } catch (error) {
      console.error(error)
      setErrorMsg(`Failed to fetch prayer times. Please try again later`)
    }
  }

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()

        if (status !== 'granted') {
          throw new Error(`Permission to access location was denied`)
        }

        const location = await Location.getCurrentPositionAsync({})
        setLocation(location)
      } catch (error) {
        console.error(error)
        setErrorMsg(`Failed to fetch location. Please try again later`)
      }
    }

    fetchLocation()
  }, [])

  useEffect(() => {
    if (location && currentDay) {
      fetchPrayerTimes(location.coords.latitude, location.coords.longitude, currentDay)
    }
  }, [location, currentDay])

  const goToPreviousDay = async () => {
    const newDay = new Date(currentDay)
    newDay.setDate(currentDay.getDate() - 1)
    setCurrentDay(newDay)
    await fetchPrayerTimes(location?.coords.latitude, location?.coords.longitude, newDay)
  }

  const goToNextDay = async () => {
    const newDay = new Date(currentDay)
    newDay.setDate(currentDay.getDate() + 1)
    setCurrentDay(newDay)
    await fetchPrayerTimes(location?.coords.latitude, location?.coords.longitude, newDay)
  }

  const handleCheck = async (id: number) => {
    const checkedPrayers = JSON.parse((await AsyncStorage.getItem('checked_prayers')) || '{}')

    const updatedPrayers = prayers.map((prayer) => {
      if (prayer.id === id) {
        const updatedPrayer = { ...prayer, checked: !prayer.checked }
        checkedPrayers[id] = updatedPrayer.checked
        return updatedPrayer
      }
      return prayer
    })

    await AsyncStorage.setItem('checked_prayers', JSON.stringify(checkedPrayers))
    setPrayers(updatedPrayers)
  }

  return {
    errorMsg,
    prayers,
    currentDay,
    fetchPrayerTimes,
    goToPreviousDay,
    goToNextDay,
    handleCheck,
  }
}

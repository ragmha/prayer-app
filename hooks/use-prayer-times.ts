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

const checkedItemsKey = 'checked_prayers'

export const usePrayerTimes = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [prayers, setPrayers] = useState<Item[]>([])
  const [currentDay, setCurrentDay] = useState<Date>(new Date())
  const [loading, setLoading] = useState<boolean>(false)

  const fetchPrayerTimes = async (latitude?: number, longitude?: number, date?: Date) => {
    const dateString = date?.toISOString().split('T')[0]
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    try {
      setLoading(true)
      const response = await fetch(
        `http://api.aladhan.com/v1/timings/${dateString}?latitude=${latitude}&longitude=${longitude}&method=3&timezonestring=${timeZone}&school=1`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch prayer times')
      }

      const data = await response.json()
      const prayerTimes = data.data.timings

      const checkedItems = await AsyncStorage.getItem(checkedItemsKey)
      const checkedItemsMap = checkedItems ? JSON.parse(checkedItems) : {}

      const newPrayers: Item[] = Object.values(Prayer).map((title, index) => ({
        id: index + 1,
        title,
        checked: !!checkedItemsMap[index + 1],
        time: prayerTimes[title] || '',
        date: dateString || '',
      }))

      setPrayers(newPrayers)
    } catch (error) {
      console.error(error)
      setErrorMsg('Failed to fetch prayer times. Please try again later')
    } finally {
      setLoading(false)
    }
  }

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied')
      }
      const loc = await Location.getCurrentPositionAsync()
      setLocation(loc)
    } catch (error) {
      console.error(error)
      setErrorMsg('Failed to fetch location. Please try again later')
    }
  }

  useEffect(() => {
    if (location) {
      fetchPrayerTimes(location.coords.latitude, location.coords.longitude, currentDay)
    }
  }, [location, currentDay])

  useEffect(() => {
    fetchLocation()
  }, [])

  const goToPreviousDay = () => {
    setCurrentDay((prev) => new Date(prev.setDate(prev.getDate() - 1)))
  }

  const goToNextDay = () => {
    setCurrentDay((prev) => new Date(prev.setDate(prev.getDate() + 1)))
  }

  const handleCheck = async (id: number) => {
    const checkedPrayers = JSON.parse((await AsyncStorage.getItem(checkedItemsKey)) || '{}')
    const updatedPrayers = prayers.map((prayer) => {
      if (prayer.id === id) {
        const updatedPrayer = { ...prayer, checked: !prayer.checked }
        checkedPrayers[id] = updatedPrayer.checked
        return updatedPrayer
      }
      return prayer
    })
    await AsyncStorage.setItem(checkedItemsKey, JSON.stringify(checkedPrayers))
    setPrayers(updatedPrayers)
  }

  return {
    errorMsg,
    prayers,
    currentDay,
    goToPreviousDay,
    goToNextDay,
    handleCheck,
    loading,
  }
}

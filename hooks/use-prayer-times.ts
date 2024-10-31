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

export const usePrayerTimes = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [prayers, setPrayers] = useState<Item[]>([])
  const [currentDay, setCurrentDay] = useState<Date>(new Date())
  const [loading, setLoading] = useState<boolean>(false)

  const fetchPrayerTimes = async (latitude?: number, longitude?: number, date?: Date) => {
    const dateString = date?.toISOString().split('T')[0]
    const checkedItemskey = `checked_prayers`

    try {
      setLoading(true)
      const TimeZone = 'Europe/Helsinki'

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

      setPrayers(newPrayers)
      setLoading(false)

      const checkedItems = await AsyncStorage.getItem(checkedItemskey)

      if (checkedItems) {
        const checkedItemsMap = JSON.parse(checkedItems)
        const updatedPrayers = newPrayers.map((prayer) => ({
          ...prayer,
          checked: !!checkedItemsMap[prayer.id],
        }))
        setPrayers(updatedPrayers)
      }
    } catch (error) {
      console.error(error)
      setErrorMsg(`Failed to fetch prayer times. Please try again later`)
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      if (location) {
        setLoading(true)

        await fetchPrayerTimes(location.coords.latitude, location.coords.longitude, currentDay)
        const previousDay = new Date(currentDay)
        previousDay.setDate(currentDay.getDate() - 1)
        await fetchPrayerTimes(location.coords.latitude, location.coords.longitude, previousDay)

        const nextDay = new Date(currentDay)
        nextDay.setDate(currentDay.getDate() + 1)
        await fetchPrayerTimes(location.coords.latitude, location.coords.longitude, nextDay)

        setLoading(false)
      }
    }

    fetchInitialData()
  }, [location, currentDay])

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
    loading,
  }
}

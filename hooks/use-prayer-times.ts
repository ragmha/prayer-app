import { useEffect, useState } from 'react'

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
}

export const usePrayerTimes = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [prayers, setPrayers] = useState<Item[]>([])
  const [currentDay, setCurrentDay] = useState<Date>(new Date())

  const fetchPrayerTimes = async (latitude?: number, longitude?: number, date?: Date) => {
    const dateString = date?.toISOString().split('T')[0]

    try {
      const response = await fetch(
        `http://api.aladhan.com/v1/timings/${dateString}?latitude=${latitude}&longitude=${longitude}&method=2&timezonestring=Europe/Helsinki`,
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
      }))

      console.log({ newPrayers })

      setPrayers(newPrayers)
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

  const handleCheck = (id: number) => {
    const newPrayers = prayers.map((prayer) => {
      if (prayer.id === id) {
        return { ...prayer, checked: !prayer.checked }
      }
      return prayer
    })

    setPrayers(newPrayers)
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

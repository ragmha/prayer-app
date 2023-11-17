import {
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native'
import React, { FC, useEffect, useState } from 'react'
import { DateTime } from 'luxon'

type Item = {
  id: number
  title: string
  checked: boolean
  time: string
}

import * as Location from 'expo-location'
import * as Localization from 'expo-localization'
import { AntDesign } from '@expo/vector-icons'

const Header: FC<{
  items: Item[]
  currentDay: Date
  onPreviousDay: () => void
  onNextDay: () => void
}> = ({ items, currentDay, onPreviousDay, onNextDay }) => {
  const completedPrayers = items.filter((item) => item.checked).length

  const isToday = DateTime.fromJSDate(currentDay).hasSame(
    DateTime.local(),
    'day'
  )

  const zone = Localization.getCalendars()[0].timeZone ?? 'Helsinki/Europe'

  const displayDay = isToday
    ? 'Today'
    : DateTime.fromJSDate(currentDay)
        .setZone(zone)
        .toLocaleString(DateTime.DATE_HUGE)

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPreviousDay}>
          <Text style={styles.headerButton}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNextDay}>
          <Text style={styles.headerButton}>Next</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerText}>{displayDay}</Text>
      <Text style={styles.subHeaderText}>
        Completed Prayers: {completedPrayers}
      </Text>
    </>
  )
}

const Home: FC = () => {
  const [prayers, setPrayers] = useState<Item[]>([
    { id: 1, title: 'Fajr', checked: false, time: '' },
    { id: 2, title: 'Dhuhr', checked: false, time: '' },
    { id: 3, title: 'Asr', checked: false, time: '' },
    { id: 4, title: 'Maghrib', checked: false, time: '' },
    { id: 5, title: 'Isha', checked: false, time: '' },
  ])

  const [currentDay, setCurrentDay] = useState<Date>(new Date())

  const goToPreviousDay = () => {
    const newDay = new Date(currentDay)
    newDay.setDate(currentDay.getDate() - 1)
    setCurrentDay(newDay)
  }

  const goToNextDay = () => {
    const newDay = new Date(currentDay)
    newDay.setDate(currentDay.getDate() + 1)
    setCurrentDay(newDay)
  }

  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchPrayerTimes = async (
    latitude?: number,
    longitude?: number,
    date?: Date
  ) => {
    const dateString = date?.toISOString().split('T')[0]

    try {
      const response = await fetch(
        `http://api.aladhan.com/v1/timings/${dateString}?latitude=${latitude}&longitude=${longitude}&method=2&timezonestring=Europe/Helsinki`
      )

      const data = await response.json()

      const prayerTimes = data.data.timings

      const newPrayers = prayers.map((prayer) => {
        const time = prayerTimes[prayer.title.toLowerCase()]
        return time ? { ...prayer, time } : prayer
      })

      setPrayers(newPrayers)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    ;(async () => {
      let { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        setErrorMsg(`Permission to access location was denied`)
        return
      }

      let location = await Location.getCurrentPositionAsync({})
      setLocation(location)
    })()
  }, [])

  useEffect(() => {
    fetchPrayerTimes(
      location?.coords.latitude,
      location?.coords.longitude,
      currentDay
    )
  }, [currentDay, location])

  const handleCheck = (id: number) => {
    const newPrayers = prayers.map((prayer) => {
      if (prayer.id === id) {
        return { ...prayer, checked: !prayer.checked }
      }
      return prayer
    })

    setPrayers(newPrayers)
  }

  const renderItem = ({ item }: { item: Item }) => {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => handleCheck(item.id)}
        >
          <View
            style={
              item.checked ? styles.checkedCheckbox : styles.uncheckedCheckbox
            }
          >
            {item.checked && (
              <AntDesign name="checkcircle" size={32} color="black" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={item.checked ? styles.strikethroughTitle : styles.title}>
          {item.title}
        </Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    )
  }

  return (
    <>
      <Header
        items={prayers}
        currentDay={currentDay}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
      />
      <FlatList data={prayers} renderItem={renderItem} />
    </>
  )
}

export default Home

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginVertical: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 24,
    color: '#e91e63',
    flex: 1,
    fontWeight: '500',
  },
  strikethroughTitle: {
    fontSize: 24,
    color: '#e91e63',
    flex: 1,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uncheckedCheckbox: {
    height: 32,
    width: 32,
    borderRadius: 16,
    borderWidth: 6,
    borderColor: '#3d5afe',
  },
  checkedCheckbox: {
    height: 32,
    width: 32,
    borderRadius: 16,
    borderColor: '#e91e63',
    backgroundColor: '#00e676',
  },
  time: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 40,
    color: '#009688',
  },
  header: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    textAlign: 'center',
  },
  headerButton: {
    fontSize: 20,
    color: '#009688',
  },
  headerText: {
    color: '#e91e63',
    fontSize: 23,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginRight: 20,
    textAlign: 'center',
  },
  subHeaderText: {
    textAlign: 'center',
    color: '#e91e63',
    marginTop: 10,
    fontSize: 16,
  },
})

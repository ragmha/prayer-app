import { DateTime } from 'luxon'
import { FC } from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import * as Localization from 'expo-localization'
import { Item } from '@/hooks/use-prayer-times'

interface HeaderProps {
  items: Item[]
  currentDay: Date
  onPreviousDay: () => void
  onNextDay: () => void
}

export const Header: FC<HeaderProps> = ({ items, currentDay, onPreviousDay, onNextDay }) => {
  const completedPrayers = items.filter((item) => item.checked).length

  const isToday = DateTime.fromJSDate(currentDay).hasSame(DateTime.local(), 'day')

  const zone = Localization.getCalendars()[0].timeZone ?? 'Helsinki/Europe'

  const displayDay = isToday
    ? 'Today'
    : DateTime.fromJSDate(currentDay).setZone(zone).toLocaleString(DateTime.DATE_HUGE)

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
      <Text style={styles.subHeaderText}>Completed Prayers: {completedPrayers}</Text>
    </>
  )
}

const styles = StyleSheet.create({
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

import { FlatList, TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import { FC } from 'react'

import { AntDesign } from '@expo/vector-icons'
import { Header } from 'components/Header'
import { Item, usePrayerTimes } from '@/hooks/use-prayer-times'

const PrayerItem: FC<{
  item: Item
  handleCheck(id: number): void
}> = ({ item, handleCheck }) => (
  <View style={styles.container}>
    <TouchableOpacity style={styles.item} onPress={() => handleCheck(item.id)}>
      <View style={item.checked ? styles.checkedCheckbox : styles.uncheckedCheckbox}>
        {item.checked && <AntDesign name="checkcircle" size={32} color="black" />}
      </View>
    </TouchableOpacity>
    <Text style={item.checked ? styles.strikethroughTitle : styles.title}>{item.title}</Text>
    <Text style={styles.time}>{item.time}</Text>
  </View>
)

const Home: FC = () => {
  const { prayers, handleCheck, currentDay, goToNextDay, goToPreviousDay } = usePrayerTimes()

  return (
    <>
      <Header
        items={prayers}
        currentDay={currentDay}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
      />
      <FlatList
        data={prayers}
        renderItem={({ item }) => <PrayerItem item={item} handleCheck={handleCheck} />}
        keyExtractor={(item) => item.id.toString()}
      />
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
})

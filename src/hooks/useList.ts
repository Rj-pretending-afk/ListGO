import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../lib/store'

export const useLists = () => useAppStore(s => s.lists)

export const useListById = (id: string) =>
  useAppStore(s => s.lists.find(l => l.id === id))

export const useLoaded = () => useAppStore(s => s.loaded)

export function useListActions() {
  return useAppStore(
    useShallow(s => ({
      createList: s.createList,
      updateListTitle: s.updateListTitle,
      deleteList: s.deleteList,
      addModule: s.addModule,
      updateModule: s.updateModule,
      deleteModule: s.deleteModule,
    }))
  )
}

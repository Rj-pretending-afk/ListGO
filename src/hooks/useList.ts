import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../lib/store'
import { useAuthStore } from './useAuth'
import { getOwnerToken } from '../lib/ownerToken'

// Returns only lists belonging to the current session (logged-in user OR anonymous token)
export const useLists = () => {
  const user = useAuthStore(s => s.user)
  const allLists = useAppStore(s => s.lists)
  if (user) {
    return allLists.filter(l => l.ownerId === user.id)
  }
  const token = getOwnerToken()
  return allLists.filter(l => l.ownerToken === token)
}

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

import Dexie, { type Table } from 'dexie'
import type { List } from '../types/list.types'

class ListGoDB extends Dexie {
  lists!: Table<List>

  constructor() {
    super('listgo')
    this.version(1).stores({
      lists: 'id, updatedAt, lastAccessedAt',
    })
  }
}

export const db = new ListGoDB()

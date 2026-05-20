import { customAlphabet } from 'nanoid'

// 去掉易混淆字符 0/O/I/l
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

export const generateListId = customAlphabet(ALPHABET, 8)
export const generateModuleId = customAlphabet(ALPHABET, 8)
export const generateItemId = customAlphabet(ALPHABET, 8)

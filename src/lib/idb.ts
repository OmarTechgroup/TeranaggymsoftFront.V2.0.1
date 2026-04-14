/**
 * IndexedDB utility — stockage offline pour le portail client.
 * DB: "terangagym-portal" / version 1
 * Stores:
 *   - credentials : { id: 'current', clientId, cardNumber }
 *   - clientData  : { id: clientId, client, abonnements, cachedAt }
 */

const DB_NAME    = 'terangagym-portal'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result
            if (!db.objectStoreNames.contains('credentials')) {
                db.createObjectStore('credentials', { keyPath: 'id' })
            }
            if (!db.objectStoreNames.contains('clientData')) {
                db.createObjectStore('clientData', { keyPath: 'id' })
            }
        }
        req.onsuccess  = () => resolve(req.result)
        req.onerror    = () => reject(req.error)
    })
}

function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode) {
    return db.transaction(store, mode).objectStore(store)
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((res, rej) => {
        req.onsuccess = () => res(req.result)
        req.onerror   = () => rej(req.error)
    })
}

// ── Credentials ────────────────────────────────────────────────────────────────

export interface PortalCredentials {
    clientId: number
    cardNumber: string
}

export async function saveCredentials(creds: PortalCredentials): Promise<void> {
    const db = await openDB()
    await wrap(tx(db, 'credentials', 'readwrite').put({ id: 'current', ...creds }))
    db.close()
}

export async function loadCredentials(): Promise<PortalCredentials | null> {
    const db = await openDB()
    const result = await wrap<any>(tx(db, 'credentials', 'readonly').get('current'))
    db.close()
    if (!result) return null
    return { clientId: result.clientId, cardNumber: result.cardNumber }
}

export async function clearCredentials(): Promise<void> {
    const db = await openDB()
    await wrap(tx(db, 'credentials', 'readwrite').delete('current'))
    db.close()
}

// ── Gym config cache ───────────────────────────────────────────────────────────

export interface CachedGymConfig {
    id: 'gym'
    nom: string
    hasLogo: boolean
}

export async function saveGymConfig(cfg: CachedGymConfig): Promise<void> {
    const db = await openDB()
    await wrap(tx(db, 'credentials', 'readwrite').put(cfg))
    db.close()
}

export async function loadGymConfig(): Promise<CachedGymConfig | null> {
    const db = await openDB()
    const result = await wrap<CachedGymConfig | undefined>(tx(db, 'credentials', 'readonly').get('gym'))
    db.close()
    return result ?? null
}

// ── Client data cache ──────────────────────────────────────────────────────────

export interface CachedClientData {
    id: number
    client: any
    abonnements: any[]
    cachedAt: number
}

export async function saveClientData(data: CachedClientData): Promise<void> {
    const db = await openDB()
    await wrap(tx(db, 'clientData', 'readwrite').put(data))
    db.close()
}

export async function loadClientData(clientId: number): Promise<CachedClientData | null> {
    const db = await openDB()
    const result = await wrap<CachedClientData | undefined>(
        tx(db, 'clientData', 'readonly').get(clientId)
    )
    db.close()
    return result ?? null
}

export async function clearClientData(): Promise<void> {
    const db = await openDB()
    await wrap(tx(db, 'clientData', 'readwrite').clear())
    db.close()
}

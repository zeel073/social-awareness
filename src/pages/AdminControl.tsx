import { useEffect, useId, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { DIYA_GOAL } from '../config/site'
import { siteCrowd } from '../crowd/crowd'
import { useI18n } from '../i18n/context'
import { usePage } from '../components/page-context'
import { adminKeyMatches, isAdminUnlocked, markAdminUnlocked } from './admin-access'
import NotFound from './NotFound'
import styles from './AdminControl.module.css'

const crowd = siteCrowd()

/**
 * Manual progress control at `/admin`. Not linked from the rest of the site.
 * Without the build-time ADMIN_KEY (`?key=`), visitors get the not-found page.
 */
export default function AdminControl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [gate, setGate] = useState<'pending' | 'open' | 'closed'>(() =>
    isAdminUnlocked() ? 'open' : 'pending',
  )

  useEffect(() => {
    if (gate === 'open') return
    let cancelled = false
    void (async () => {
      const key = searchParams.get('key')
      if (key && (await adminKeyMatches(key))) {
        markAdminUnlocked()
        if (!cancelled) {
          setGate('open')
          const next = new URLSearchParams(searchParams)
          next.delete('key')
          setSearchParams(next, { replace: true })
        }
        return
      }
      if (!cancelled) setGate('closed')
    })()
    return () => {
      cancelled = true
    }
  }, [gate, searchParams, setSearchParams])

  if (gate === 'pending') return null
  if (gate === 'closed') return <NotFound />
  return <AdminPanel />
}

function AdminPanel() {
  const { t } = useI18n()
  usePage(t('admin.title'))
  const exactId = useId()
  const [count, setCount] = useState<number | null>(null)
  const [exact, setExact] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    let cancelled = false
    void crowd.readCount().then((value) => {
      if (!cancelled) {
        setCount(value)
        setExact(String(value))
      }
    })
    const unsubscribe = crowd.subscribe((value) => {
      if (!cancelled) {
        setCount(value)
        setExact(String(value))
      }
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  async function write(next: number) {
    if (busy) return
    setBusy(true)
    setStatus('idle')
    try {
      await crowd.setCount(next)
      const value = await crowd.readCount()
      setCount(value)
      setExact(String(value))
      setStatus('saved')
    } catch {
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }

  function onExact(event: FormEvent) {
    event.preventDefault()
    const n = Number(exact)
    if (!Number.isFinite(n)) {
      setStatus('error')
      return
    }
    void write(n)
  }

  const shown = count ?? 0

  return (
    <section className={styles.panel} data-testid="admin-control">
      <h1>{t('admin.title')}</h1>
      <p className={styles.count} aria-live="polite">
        {count === null ? t('admin.loading') : t('admin.of', { count: shown, goal: DIYA_GOAL })}
      </p>

      <div className={styles.row} role="group" aria-label={t('admin.adjust')}>
        <button
          type="button"
          className={styles.button}
          disabled={busy}
          onClick={() => void write(shown - 1)}
        >
          {t('admin.minus1')}
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={busy}
          onClick={() => void write(shown + 1)}
        >
          {t('admin.plus1')}
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={busy}
          onClick={() => void write(shown + 5)}
        >
          {t('admin.plus5')}
        </button>
      </div>

      <form className={styles.exact} onSubmit={onExact}>
        <label htmlFor={exactId}>{t('admin.exact')}</label>
        <input
          id={exactId}
          type="number"
          inputMode="numeric"
          min={0}
          max={DIYA_GOAL}
          value={exact}
          onChange={(event) => setExact(event.target.value)}
          disabled={busy}
        />
        <button type="submit" className={styles.button} disabled={busy}>
          {t('admin.set')}
        </button>
      </form>

      <div className={styles.row}>
        <button
          type="button"
          className={styles.button}
          disabled={busy}
          onClick={() => void write(DIYA_GOAL)}
        >
          {t('admin.full', { goal: DIYA_GOAL })}
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={busy}
          onClick={() => void write(0)}
        >
          {t('admin.reset')}
        </button>
      </div>

      <p className={styles.status} data-status={status} aria-live="polite">
        {status === 'saved' ? t('admin.saved') : status === 'error' ? t('admin.error') : '\u00a0'}
      </p>
    </section>
  )
}

import { BrowserRouter, Route, Routes } from 'react-router'
import { Analytics } from '@vercel/analytics/react'
import { I18nProvider } from './i18n/I18nProvider'
import { Layout } from './components/Layout'
import Intro from './pages/Intro'
import NotFound from './pages/NotFound'
import AdminControl from './pages/AdminControl'

/** React Router wants the base path without a trailing slash. */
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Intro />} />
            {/* Progress control. Locked without ADMIN_KEY; not linked in the UI. */}
            <Route path="admin" element={<AdminControl />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      {/* Anonymous page-view counts, on the Vercel deployment only (see vite.config.ts). */}
      {__VERCEL_ANALYTICS__ && <Analytics />}
    </I18nProvider>
  )
}

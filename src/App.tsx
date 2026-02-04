import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage'
import CreatorsPage from './pages/CreatorsPage'
import CreatorProfilePage from './pages/CreatorProfilePage'
import FanChatPage from './pages/FanChatPage'
import CreatorLayout from './components/CreatorLayout/CreatorLayout'
import CreatorTwinPage from './pages/CreatorTwinPage'
import CreatorCreationPage from './pages/CreatorCreationPage'
import CreatorContentManagePage from './pages/CreatorContentManagePage'
import CreatorMessagesManagePage from './pages/CreatorMessagesManagePage'
import CreatorAnalyticsPage from './pages/CreatorAnalyticsPage'
import CreatorSettingsPage from './pages/CreatorSettingsPage'
import CreatorAccountPage from './pages/CreatorAccountPage'
import MessagesPage from './pages/MessagesPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/creators" element={<CreatorsPage />} />
        <Route path="/chat/:creatorId" element={<FanChatPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        {/* 创作者后台嵌套路由必须放在 /creator/:creatorId 之前，否则 /creator/creation 会被当成创作者主页 */}
        <Route path="/creator" element={<CreatorLayout />}>
          <Route index element={<Navigate to="creation" replace />} />
          <Route path="creation" element={<CreatorCreationPage />} />
          <Route path="twin" element={<CreatorTwinPage />} />
          <Route path="content" element={<CreatorContentManagePage />} />
          <Route path="messages" element={<CreatorMessagesManagePage />} />
          <Route path="analytics" element={<CreatorAnalyticsPage />} />
          <Route path="settings" element={<CreatorSettingsPage />} />
          <Route path="account" element={<CreatorAccountPage />} />
        </Route>
        <Route path="/creator/:creatorId/*" element={<CreatorProfilePage />} />
      </Routes>
    </Layout>
  )
}

export default App

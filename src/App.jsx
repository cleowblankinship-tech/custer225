import { useState } from 'react'
import Sidebar from './components/petra/Sidebar'
import ChatPanel from './components/petra/ChatPanel'
import { conversations } from './data/conversations'
import './petra.css'

export default function App() {
  const [activeId, setActiveId] = useState('henderson-trust')

  const activeConversation = conversations.find(c => c.id === activeId) || conversations[0]

  return (
    <div className="petra-app">
      <Sidebar activeId={activeId} onSelect={setActiveId} />
      <ChatPanel conversation={activeConversation} key={activeId} />
    </div>
  )
}

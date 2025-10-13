import { useEffect } from 'react'
import { usePoemStore } from './state/poemStore'
import { Layout } from './components/Layout'
import './index.css'

export default function App() {
  useEffect(() => {
    // Load poem from structured JSON data
    usePoemStore.getState().loadPoem()
  }, [])

  return <Layout />
}

import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { usePoemStore } from './state/poemStore'
import { Layout } from './components/Layout'
import './index.css'

export default function App() {
  useEffect(() => {
    // Load poem from structured JSON data
    usePoemStore.getState().loadPoem()
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <Layout />
    </MotionConfig>
  )
}

import React, { useState, useEffect } from 'react'
import { initDB } from './db.js'
import { itemTypes, TYPE_LIST } from './types/index.js'
import { loadIcon } from './icon-loader.js'
import ListView from './components/ListView.jsx'
import ItemDetailView from './components/ItemDetailView.jsx'

function App() {
  const [currentPath, setCurrentPath] = useState('/')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDbInitialized, setIsDbInitialized] = useState(false)
  const [error, setError] = useState(null)

  // Initialize database
  useEffect(() => {
    const initializeDb = async () => {
      try {
        await initDB()
        console.log('Database ready.')
        setIsDbInitialized(true)
      } catch (err) {
        console.error('Failed to initialize database:', err)
        setError('Error: Could not initialize the database.')
      }
    }
    
    initializeDb()
  }, [])

  // Handle URL changes (hash-based routing)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) || '/'
      setCurrentPath(hash)
      setIsEditMode(!hash.endsWith('/'))
    }

    // Set initial path
    handleHashChange()
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Navigate to path
  const navigateTo = (path) => {
    window.location.hash = path
  }

  if (error) {
    return (
      <div className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 min-h-screen">
        <header className="bg-blue-600 text-white shadow-md dark:bg-blue-800">
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Modulista</h1>
          </div>
        </header>
        <main className="container mx-auto p-4">
          <p className="text-red-500">{error}</p>
        </main>
      </div>
    )
  }

  if (!isDbInitialized) {
    return (
      <div className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 min-h-screen">
        <header className="bg-blue-600 text-white shadow-md dark:bg-blue-800">
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Modulista</h1>
          </div>
        </header>
        <main className="container mx-auto p-4">
          <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 min-h-screen">
      <header className="bg-blue-600 text-white shadow-md dark:bg-blue-800">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold">Modulista</h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {isEditMode ? (
          <ItemDetailView 
            path={currentPath} 
            onNavigate={navigateTo}
          />
        ) : (
          <ListView 
            path={currentPath} 
            onNavigate={navigateTo}
          />
        )}
      </main>
    </div>
  )
}

export default App
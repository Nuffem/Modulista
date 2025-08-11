import React, { useState, useEffect } from 'react'
import { getItems } from '../db.js'
import { loadIcon } from '../icon-loader.js'
import Breadcrumb from './Breadcrumb.jsx'
import ListContent from './ListContent.jsx'
import TextContent from './TextContent.jsx'

function ListView({ path, onNavigate }) {
  const [items, setItems] = useState([])
  const [currentView, setCurrentView] = useState('list')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Ensure path format
  const normalizedPath = path.startsWith('/') ? path : '/' + path
  const finalPath = normalizedPath.endsWith('/') ? normalizedPath : normalizedPath + '/'

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true)
        const fetchedItems = await getItems(finalPath)
        setItems(fetchedItems)
        setError(null)
      } catch (err) {
        console.error('Failed to load items:', err)
        setError('Erro ao carregar os itens.')
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [finalPath])

  // Check if landscape mode
  const isLandscapeMode = () => {
    return window.innerWidth > window.innerHeight && window.innerWidth >= 768
  }

  const [isLandscape, setIsLandscape] = useState(isLandscapeMode())

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(isLandscapeMode())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (loading) {
    return (
      <>
        <Breadcrumb path={finalPath} onNavigate={onNavigate} />
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Breadcrumb path={finalPath} onNavigate={onNavigate} />
        <p className="text-red-500">{error}</p>
      </>
    )
  }

  if (isLandscape) {
    // Side-by-side layout for landscape mode
    return (
      <>
        <Breadcrumb path={finalPath} onNavigate={onNavigate} />
        <div className="mb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
              <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <img className="w-5 h-5 mr-2" />
                Lista
              </span>
              <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <img className="w-5 h-5 mr-2" />
                Texto
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                <img className="w-5 h-5 mr-2" />
                Lista
              </h3>
              <ListContent 
                path={finalPath} 
                items={items} 
                onNavigate={onNavigate}
                onItemsUpdate={setItems}
              />
            </div>
            <div className="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                <img className="w-5 h-5 mr-2" />
                Texto
              </h3>
              <TextContent 
                path={finalPath} 
                items={items} 
                onNavigate={onNavigate}
                onItemsUpdate={setItems}
              />
            </div>
          </div>
        </div>
      </>
    )
  } else {
    // Tab layout for portrait mode
    const isListActive = currentView === 'list'
    const isTextActive = currentView === 'text'

    return (
      <>
        <Breadcrumb path={finalPath} onNavigate={onNavigate} />
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex -mb-px text-sm font-medium text-center">
            <li className="flex-1">
              <button 
                onClick={() => setCurrentView('list')}
                className={`inline-flex justify-center w-full items-center p-4 border-b-2 rounded-t-lg group ${
                  isListActive 
                    ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' 
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <img className="w-5 h-5 mr-2" />
                Lista
              </button>
            </li>
            <li className="flex-1">
              <button 
                onClick={() => setCurrentView('text')}
                className={`inline-flex justify-center w-full items-center p-4 border-b-2 rounded-t-lg group ${
                  isTextActive 
                    ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' 
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <img className="w-5 h-5 mr-2" />
                Texto
              </button>
            </li>
          </ul>
        </div>
        
        <div id="tab-content">
          {isListActive ? (
            <ListContent 
              path={finalPath} 
              items={items} 
              onNavigate={onNavigate}
              onItemsUpdate={setItems}
            />
          ) : (
            <TextContent 
              path={finalPath} 
              items={items} 
              onNavigate={onNavigate}
              onItemsUpdate={setItems}
            />
          )}
        </div>
      </>
    )
  }
}

export default ListView
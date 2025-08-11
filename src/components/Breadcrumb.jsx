import React, { useState, useEffect } from 'react'
import { loadIcon } from '../icon-loader.js'

function Breadcrumb({ path, itemName = null, onNavigate }) {
  const [breadcrumbHTML, setBreadcrumbHTML] = useState('')

  useEffect(() => {
    const renderBreadcrumb = async () => {
      const parts = path.split('/').filter(p => p)
      let cumulativePath = '/'
      let html = '<div class="flex items-center">'
      
      // Home icon
      const homeIcon = await loadIcon('home', { size: 'w-5 h-5' })
      html += `<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${homeIcon}</button>`
      
      // Path parts
      for (const part of parts) {
        cumulativePath += `${part}/`
        html += ` <span class="text-gray-500 mx-2">/</span> <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${decodeURIComponent(part)}</button>`
      }
      
      // Item name if provided
      if (itemName) {
        html += ` <span class="text-gray-500 mx-2">/</span> <span class="font-semibold">${itemName}</span>`
      }
      
      html += '</div>'
      setBreadcrumbHTML(html)
    }

    renderBreadcrumb()
  }, [path, itemName])

  const handleClick = (event) => {
    const button = event.target.closest('button')
    if (button) {
      const isHomeButton = button.querySelector('svg') // Home button has an icon
      if (isHomeButton) {
        onNavigate('/')
      } else {
        // Find the button index to determine path
        const buttons = Array.from(event.currentTarget.querySelectorAll('button'))
        const buttonIndex = buttons.indexOf(button)
        
        if (buttonIndex === 0) {
          onNavigate('/')
        } else {
          const parts = path.split('/').filter(p => p)
          const targetPath = '/' + parts.slice(0, buttonIndex).join('/') + '/'
          onNavigate(targetPath)
        }
      }
    }
  }

  return (
    <nav 
      className="mb-4 text-sm text-gray-600 dark:text-gray-400"
      dangerouslySetInnerHTML={{ __html: breadcrumbHTML }}
      onClick={handleClick}
    />
  )
}

export default Breadcrumb
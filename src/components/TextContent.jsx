import React, { useState, useEffect } from 'react'
import { getItems } from '../db.js'
import { parse, stringify, executePlan } from '../custom-parser.js'
import { loadIcon } from '../icon-loader.js'

function TextContent({ path, items, onNavigate, onItemsUpdate }) {
  const [textContent, setTextContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [contentHTML, setContentHTML] = useState('')

  useEffect(() => {
    const generateTextContent = async () => {
      try {
        const plan = stringify(items, path)
        const str = await executePlan(plan, getItems)
        setTextContent(str)
      } catch (error) {
        console.error("Stringify error:", error)
        setTextContent(`Erro ao gerar o texto: ${error.message}`)
      }
    }

    generateTextContent()
  }, [items, path])

  useEffect(() => {
    const renderContent = async () => {
      const uploadIcon = await loadIcon('upload', { size: 'w-6 h-6' })
      const downloadIcon = await loadIcon('download', { size: 'w-6 h-6' })
      const pencilIcon = await loadIcon('pencil', { size: 'w-6 h-6' })
      const checkIcon = await loadIcon('check', { size: 'w-6 h-6' })
      const xIcon = await loadIcon('x', { size: 'w-6 h-6' })

      if (isEditing) {
        setContentHTML(`
          <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
            <div id="text-edit">
              <textarea id="text-editor" class="w-full h-64 bg-gray-100 p-4 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">${editValue}</textarea>
              <div class="mt-4 flex justify-end space-x-2">
                <button id="save-text-btn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700">
                  ${checkIcon}
                </button>
                <button id="cancel-text-btn" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                  ${xIcon}
                </button>
              </div>
            </div>
          </div>
        `)
      } else {
        setContentHTML(`
          <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
            <div id="text-display">
              <pre class="bg-gray-100 p-4 rounded overflow-x-auto dark:bg-gray-700 dark:text-gray-200"><code>${textContent}</code></pre>
              <div class="mt-4 flex justify-end space-x-2">
                <button id="load-from-device-btn" title="Carregar do dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                  ${uploadIcon}
                </button>
                <button id="save-to-device-btn" title="Salvar no dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                  ${downloadIcon}
                </button>
                <button id="edit-text-btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700">
                  ${pencilIcon}
                </button>
              </div>
            </div>
          </div>
        `)
      }
    }

    renderContent()
  }, [isEditing, textContent, editValue])

  const handleClick = async (event) => {
    const target = event.target.closest('button')
    if (!target) return

    if (target.id === 'edit-text-btn') {
      setEditValue(textContent)
      setIsEditing(true)
    } else if (target.id === 'cancel-text-btn') {
      setIsEditing(false)
    } else if (target.id === 'save-text-btn') {
      const newText = document.getElementById('text-editor')?.value || editValue
      try {
        const { syncItems } = await import('../app-vanilla.js')
        const newItemsObject = parse(newText)
        await syncItems(path, newItemsObject)
        const refreshedItems = await getItems(path)
        onItemsUpdate(refreshedItems)
        setIsEditing(false)
        onNavigate(path) // Navigate back to list view
      } catch (error) {
        console.error('Failed to parse and update items:', error)
        alert('Erro ao salvar. Verifique a sintaxe.\n' + error.message)
      }
    } else if (target.id === 'load-from-device-btn') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt,text/plain'

      input.onchange = e => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = event => {
          const fileContent = event.target.result
          setEditValue(fileContent)
          setIsEditing(true)
        }

        reader.onerror = event => {
          console.error("File could not be read!", event)
          alert("Erro ao ler o arquivo.")
        }

        reader.readAsText(file)
      }

      input.click()
    } else if (target.id === 'save-to-device-btn') {
      const text = textContent
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const pathParts = path.split('/').filter(p => p)
      const fileName = pathParts.length > 0 ? `${pathParts.join('_')}.txt` : 'modulista_root.txt'
      a.download = fileName

      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    }
  }

  const handleTextareaChange = (event) => {
    setEditValue(event.target.value)
  }

  useEffect(() => {
    const textarea = document.getElementById('text-editor')
    if (textarea) {
      textarea.addEventListener('input', handleTextareaChange)
      return () => textarea.removeEventListener('input', handleTextareaChange)
    }
  }, [isEditing])

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: contentHTML }}
      onClick={handleClick}
    />
  )
}

export default TextContent
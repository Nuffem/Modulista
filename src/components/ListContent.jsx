import React, { useState, useEffect } from 'react'
import { addItem, getItems, updateItemsOrder } from '../db.js'
import { itemTypes, TYPE_LIST, TYPE_TEXT, TYPE_BOOLEAN } from '../types/index.js'
import { loadIcon } from '../icon-loader.js'

function ListContent({ path, items, onNavigate, onItemsUpdate }) {
  const [listHTML, setListHTML] = useState('')
  const [addButtonHTML, setAddButtonHTML] = useState('')

  useEffect(() => {
    const renderList = async () => {
      if (items.length === 0) {
        setListHTML('<p class="text-gray-500 dark:text-gray-400">Nenhum item encontrado.</p>')
      } else {
        const itemRows = await Promise.all(items.map(item => renderItemRow(item)))
        setListHTML('<ul id="item-list" class="space-y-3">' + itemRows.join('') + '</ul>')
      }
      
      const plusIcon = await loadIcon('plus', { size: 'w-8 h-8' })
      setAddButtonHTML(`
        <button data-testid="add-item-button" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800">
          ${plusIcon}
        </button>
      `)
    }

    renderList()
  }, [items, path])

  const renderItemRow = async (item) => {
    const itemUrl = `#${item.path}${item.name}${item.type === TYPE_LIST ? '/' : ''}`
    const type = itemTypes[item.type]
    const valueDisplay = type.formatValueForDisplay(item)
    const icon = await type.getIcon()
    const grabIcon = await loadIcon('grab-handle', { size: 'w-6 h-6', color: 'text-gray-400 dark:text-gray-500 cursor-grab handle' })

    return `
      <li data-id="${item.id}" draggable="true" class="p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition flex items-center justify-between dark:bg-gray-800 dark:hover:bg-gray-700">
        <a href="${itemUrl}" class="flex items-center grow">
          <div class="mr-4">${icon}</div>
          <span class="font-semibold">${item.name}</span>
        </a>
        <div class="flex items-center">
          ${item.type === TYPE_BOOLEAN
            ? `<input type="checkbox" ${item.value ? 'checked' : ''} disabled class="form-checkbox h-5 w-5 text-blue-600 mr-4">`
            : `<span class="text-gray-700 mr-4 dark:text-gray-300">${valueDisplay}</span>`
          }
          ${grabIcon}
        </div>
      </li>`
  }

  const handleAddItemClick = async () => {
    try {
      const currentItems = await getItems(path)
      const newItemData = createNewItem(path, currentItems)
      const newItem = await addItem(newItemData)
      onNavigate(`${newItem.path}${newItem.name}`)
    } catch (error) {
      console.error('Failed to add item:', error)
      alert(`Erro ao adicionar o item: ${error.message}`)
    }
  }

  const createNewItem = (path, items) => {
    const baseName = "Item"
    
    // Filter items that match the pattern "Item" or "Item_number"
    const sameNameItems = items.filter(item => {
      return item.name === baseName || item.name.startsWith(baseName + '_')
    })

    let maxIndex = 0
    if (sameNameItems.length > 0) {
      const indices = sameNameItems.map(item => {
        if (item.name === baseName) return 1 // "Item" counts as Item_1
        const match = item.name.match(/_(\d+)$/)
        return match ? parseInt(match[1], 10) : 0
      })
      maxIndex = Math.max(...indices)
    }

    const newName = maxIndex === 0 ? baseName : `${baseName}_${maxIndex + 1}`

    return {
      path,
      name: newName,
      type: TYPE_TEXT,
      value: ''
    }
  }

  const handleListClick = (event) => {
    const addButton = event.target.closest('[data-testid="add-item-button"]')
    if (addButton) {
      event.preventDefault()
      handleAddItemClick()
      return
    }

    const link = event.target.closest('a[href]')
    if (link) {
      event.preventDefault()
      const href = link.getAttribute('href')
      if (href.startsWith('#')) {
        onNavigate(href.substring(1))
      }
    }
  }

  const setupDragAndDrop = () => {
    const container = document.getElementById('item-list')
    if (!container) return

    let draggedItemId = null

    container.addEventListener('dragstart', e => {
      const target = e.target.closest('li[data-id]')
      if (target && target.draggable) {
        draggedItemId = target.dataset.id
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', draggedItemId)
        setTimeout(() => {
          target.classList.add('opacity-50')
        }, 0)
      }
    })

    container.addEventListener('dragend', e => {
      const target = e.target.closest('li[data-id]')
      if (target) {
        target.classList.remove('opacity-50')
      }
    })

    container.addEventListener('dragover', e => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const target = e.target.closest('li[data-id]')
      if (target && target.dataset.id !== draggedItemId) {
        const rect = target.getBoundingClientRect()
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > .5
        const draggedElement = document.querySelector(`[data-id='${draggedItemId}']`)
        if (draggedElement) {
          if (next) {
            target.parentNode.insertBefore(draggedElement, target.nextSibling)
          } else {
            target.parentNode.insertBefore(draggedElement, target)
          }
        }
      }
    })

    container.addEventListener('drop', async e => {
      e.preventDefault()
      const liElements = Array.from(container.querySelectorAll('li[data-id]'))
      const newOrderedIds = liElements.map(li => li.dataset.id)

      const updatedItems = items.map(item => {
        const newIndex = newOrderedIds.indexOf(item.id)
        return { ...item, order: newIndex }
      })

      try {
        await updateItemsOrder(updatedItems)
        const refreshedItems = await getItems(path)
        onItemsUpdate(refreshedItems)
      } catch (error) {
        console.error("Failed to update item order:", error)
        const refreshedItems = await getItems(path)
        onItemsUpdate(refreshedItems)
      }
    })
  }

  useEffect(() => {
    setupDragAndDrop()
  }, [listHTML])

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: listHTML + addButtonHTML }}
      onClick={handleListClick}
    />
  )
}

export default ListContent
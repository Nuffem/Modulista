import React, { useState, useEffect } from 'react'
import { getItemByPathAndName, updateItem, deleteItem } from '../db.js'
import { itemTypes, availableTypes, TYPE_NUMBER } from '../types/index.js'
import { loadIcon } from '../icon-loader.js'
import Breadcrumb from './Breadcrumb.jsx'

function ItemDetailView({ path, onNavigate }) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formHTML, setFormHTML] = useState('')

  useEffect(() => {
    const loadItem = async () => {
      try {
        setLoading(true)
        const fullPath = path
        const parts = fullPath.split('/').filter(p => p)
        const itemName = parts.pop()
        let itemPath = `/${parts.join('/')}/`
        if (itemPath === '//') {
          itemPath = '/'
        }

        const fetchedItem = await getItemByPathAndName(itemPath, itemName)
        
        if (!fetchedItem) {
          setError('Item não encontrado.')
          return
        }

        setItem(fetchedItem)
        setError(null)
      } catch (err) {
        console.error('Failed to load item:', err)
        setError('Erro ao carregar o item.')
      } finally {
        setLoading(false)
      }
    }

    loadItem()
  }, [path])

  useEffect(() => {
    if (!item) return

    const renderForm = async () => {
      const type = itemTypes[item.type]
      const valueInputHTML = type.renderEditControl(item)
      const typeSelector = renderTypeSelector(item)
      
      const checkIcon = await loadIcon('check', { size: 'w-6 h-6' })
      const xIcon = await loadIcon('x', { size: 'w-6 h-6' })
      const trashIcon = await loadIcon('trash', { size: 'w-6 h-6' })

      const formHTML = `
        <div class="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <li data-id="${item.id}" draggable="false" class="p-4 bg-blue-50 rounded-lg shadow-lg dark:bg-gray-800 border border-blue-500">
            <form id="edit-item-form-${item.id}">
              <div class="mb-4">
                <label for="item-name" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Nome</label>
                <input type="text" id="item-name" name="name" value="${item.name}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
              </div>
              <div class="mb-4">
                <label for="item-type" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Tipo</label>
                <div id="item-type-selector-${item.id}">${typeSelector}</div>
              </div>
              <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Valor</label>
                <div id="item-value-input-${item.id}">${valueInputHTML}</div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded dark:bg-blue-600 dark:hover:bg-blue-700" title="Salvar">
                    ${checkIcon}
                  </button>
                  <button type="button" id="cancel-btn" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded dark:bg-gray-600 dark:hover:bg-gray-700" title="Cancelar">
                    ${xIcon}
                  </button>
                </div>
                <button type="button" id="delete-item-btn-${item.id}" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded" title="Excluir Item">
                  ${trashIcon}
                </button>
              </div>
            </form>
          </li>
        </div>
      `
      
      setFormHTML(formHTML)
    }

    renderForm()
  }, [item])

  const renderTypeSelector = (item) => {
    const optionsHTML = availableTypes.map(type => `
      <div class="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer" data-type="${type.name}">
        ${type.label}
      </div>
    `).join('')

    return `
      <div class="relative" id="type-selector-container">
        <button type="button" id="type-selector-btn" class="w-full text-left shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
          ${itemTypes[item.type].label}
        </button>
        <div id="type-selector-popup" class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg hidden">
          <input type="text" id="type-filter" class="w-full p-2 border-b border-gray-300 dark:border-gray-600" placeholder="Filtrar tipos...">
          <div id="type-list">
            ${optionsHTML}
          </div>
        </div>
      </div>
    `
  }

  const handleFormClick = async (event) => {
    const target = event.target

    // Handle form submission
    if (target.type === 'submit' || target.closest('button[type="submit"]')) {
      event.preventDefault()
      const form = target.closest('form')
      if (form) {
        await handleFormSubmit(form)
      }
      return
    }

    // Handle cancel button
    if (target.id === 'cancel-btn' || target.closest('#cancel-btn')) {
      event.preventDefault()
      onNavigate(item.path)
      return
    }

    // Handle delete button
    if (target.id === `delete-item-btn-${item.id}` || target.closest(`#delete-item-btn-${item.id}`)) {
      event.preventDefault()
      if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
        try {
          await deleteItem(item.id)
          onNavigate(item.path)
        } catch (error) {
          console.error('Failed to delete item:', error)
          alert('Erro ao excluir o item.')
        }
      }
      return
    }

    // Handle type selector
    const typeSelectorBtn = target.closest('#type-selector-btn')
    if (typeSelectorBtn) {
      event.preventDefault()
      const popup = document.getElementById('type-selector-popup')
      if (popup) {
        popup.classList.toggle('hidden')
      }
      return
    }

    // Handle type selection
    const typeOption = target.closest('[data-type]')
    if (typeOption) {
      event.preventDefault()
      const newType = typeOption.dataset.type
      if (newType !== item.type) {
        const updatedItem = { ...item, type: newType, value: '' } // Reset value on type change
        try {
          await updateItem(updatedItem)
          setItem(updatedItem)
        } catch (error) {
          console.error('Failed to update item type:', error)
          alert('Erro ao atualizar o tipo do item.')
        }
      }
      const popup = document.getElementById('type-selector-popup')
      if (popup) {
        popup.classList.add('hidden')
      }
      return
    }
  }

  const handleFormSubmit = async (form) => {
    try {
      const type = itemTypes[item.type]
      const value = type.parseValue(form, item)
      const nameInput = form.querySelector('#item-name')
      
      const updatedItem = { 
        ...item, 
        name: nameInput.value, 
        value 
      }
      
      await updateItem(updatedItem)
      onNavigate(item.path)
    } catch (error) {
      console.error('Failed to update item:', error)
      alert(`Erro ao atualizar o item: ${error.message}`)
    }
  }

  // Close type selector popup when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const popup = document.getElementById('type-selector-popup')
      const btn = document.getElementById('type-selector-btn')
      if (popup && !popup.contains(e.target) && !btn?.contains(e.target)) {
        popup.classList.add('hidden')
      }
    }

    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [formHTML])

  // Handle type filter
  useEffect(() => {
    const handleFilterInput = () => {
      const filter = document.getElementById('type-filter')
      const typeList = document.getElementById('type-list')
      
      if (filter && typeList) {
        filter.addEventListener('input', () => {
          const filterText = filter.value.toLowerCase()
          const options = Array.from(typeList.children)
          options.forEach(option => {
            const typeName = option.textContent.toLowerCase()
            option.style.display = typeName.includes(filterText) ? 'block' : 'none'
          })
        })
      }
    }

    handleFilterInput()
  }, [formHTML])

  if (loading) {
    return (
      <>
        <Breadcrumb path={item?.path || '/'} itemName={item?.name} onNavigate={onNavigate} />
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Breadcrumb path="/" onNavigate={onNavigate} />
        <p className="text-red-500">{error}</p>
      </>
    )
  }

  if (!item) {
    return (
      <>
        <Breadcrumb path="/" onNavigate={onNavigate} />
        <p className="text-red-500">Item não encontrado.</p>
      </>
    )
  }

  return (
    <>
      <Breadcrumb path={item.path} itemName={item.name} onNavigate={onNavigate} />
      <div 
        dangerouslySetInnerHTML={{ __html: formHTML }}
        onClick={handleFormClick}
      />
    </>
  )
}

export default ItemDetailView
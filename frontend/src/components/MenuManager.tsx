import { useState, type FormEvent } from 'react'
import { Button } from '@heroui/react'
import { api, type MenuCategory, type MenuItem } from '../api'

type Props = {
  categories: MenuCategory[]
  items: MenuItem[]
  currency: string
  onChanged: () => Promise<void>
}

export function MenuManager({ categories, items, currency, onChanged }: Props) {
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryOrder, setCategoryOrder] = useState('0')
  const [categoryActive, setCategoryActive] = useState(true)
  const [itemId, setItemId] = useState<number | null>(null)
  const [itemCategoryId, setItemCategoryId] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemOrder, setItemOrder] = useState('0')
  const [itemAvailable, setItemAvailable] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function resetCategory() {
    setCategoryId(null)
    setCategoryName('')
    setCategoryOrder('0')
    setCategoryActive(true)
  }

  function resetItem() {
    setItemId(null)
    setItemCategoryId('')
    setItemName('')
    setItemDescription('')
    setItemPrice('')
    setItemOrder('0')
    setItemAvailable(true)
  }

  function editCategory(category: MenuCategory) {
    setCategoryId(category.id)
    setCategoryName(category.name)
    setCategoryOrder(String(category.sort_order))
    setCategoryActive(category.is_active)
    setError('')
    setMessage('')
  }

  function editItem(item: MenuItem) {
    setItemId(item.id)
    setItemCategoryId(String(item.menu_category_id))
    setItemName(item.name)
    setItemDescription(item.description ?? '')
    setItemPrice(item.price)
    setItemOrder(String(item.sort_order))
    setItemAvailable(item.is_available)
    setError('')
    setMessage('')
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.saveCategory({
        name: categoryName.trim(),
        sort_order: Number(categoryOrder),
        is_active: categoryActive,
      }, categoryId ?? undefined)
      await onChanged()
      resetCategory()
      setMessage('Category saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save category.')
    } finally {
      setBusy(false)
    }
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.saveItem({
        menu_category_id: Number(itemCategoryId),
        name: itemName.trim(),
        description: itemDescription.trim() || null,
        price: Number(itemPrice),
        is_available: itemAvailable,
        sort_order: Number(itemOrder),
      }, itemId ?? undefined)
      await onChanged()
      resetItem()
      setMessage('Menu item saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save menu item.')
    } finally {
      setBusy(false)
    }
  }

  async function removeCategory(category: MenuCategory) {
    if (!window.confirm(`Delete ${category.name}? Its items must be removed first.`)) return
    setBusy(true)
    setError('')
    try {
      await api.deleteCategory(category.id)
      await onChanged()
      if (categoryId === category.id) resetCategory()
      setMessage('Category deleted.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete category.')
    } finally {
      setBusy(false)
    }
  }

  async function removeItem(item: MenuItem) {
    if (!window.confirm(`Delete ${item.name}?`)) return
    setBusy(true)
    setError('')
    try {
      await api.deleteItem(item.id)
      await onChanged()
      if (itemId === item.id) resetItem()
      setMessage('Menu item deleted.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete menu item.')
    } finally {
      setBusy(false)
    }
  }

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div><p className="eyebrow">WHAT YOU SERVE</p><h1>Menu management</h1></div>
        <p>Organize categories and keep prices and availability current.</p>
      </div>
      {error && <div className="notice error-message" role="alert">{error}</div>}
      {message && <div className="notice success-message" role="status">{message}</div>}

      <div className="management-grid">
        <section className="panel">
          <div className="panel-heading"><h2>Categories <span className="count">{categories.length}</span></h2></div>
          <form onSubmit={(event) => void saveCategory(event)} className="compact-form">
            <label className="field">Category name
              <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required maxLength={255} placeholder="e.g. Coffee" />
            </label>
            <div className="form-grid">
              <label className="field">Display order
                <input type="number" min="0" value={categoryOrder} onChange={(event) => setCategoryOrder(event.target.value)} required />
              </label>
              <label className="field toggle-field"><input type="checkbox" checked={categoryActive} onChange={(event) => setCategoryActive(event.target.checked)} /> Active</label>
            </div>
            <div className="form-actions">
              <Button type="submit" isDisabled={busy}>{categoryId ? 'Save category' : 'Add category'}</Button>
              {categoryId && <button type="button" className="text-button" onClick={resetCategory}>Cancel</button>}
            </div>
          </form>
          <div className="list-stack">
            {categories.length === 0 && <p className="empty-note">Add a category to start your menu.</p>}
            {categories.map((category) => (
              <div className="list-row" key={category.id}>
                <div><strong>{category.name}</strong><small>{category.is_active ? 'Active' : 'Hidden'} · Order {category.sort_order}</small></div>
                <div className="row-actions">
                  <button type="button" onClick={() => editCategory(category)} disabled={busy}>Edit</button>
                  <button type="button" onClick={() => void removeCategory(category)} disabled={busy}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><h2>Menu items <span className="count">{items.length}</span></h2></div>
          <form onSubmit={(event) => void saveItem(event)} className="compact-form">
            <div className="form-grid">
              <label className="field">Item name
                <input value={itemName} onChange={(event) => setItemName(event.target.value)} required maxLength={255} placeholder="e.g. Flat White" />
              </label>
              <label className="field">Category
                <select value={itemCategoryId} onChange={(event) => setItemCategoryId(event.target.value)} required>
                  <option value="">Choose category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="field field-wide">Description
                <input value={itemDescription} onChange={(event) => setItemDescription(event.target.value)} maxLength={2000} placeholder="Optional" />
              </label>
              <label className="field">Price ({currency})
                <input type="number" min="0" max="99999999.99" step="0.01" value={itemPrice} onChange={(event) => setItemPrice(event.target.value)} required placeholder="0.00" />
              </label>
              <label className="field">Display order
                <input type="number" min="0" value={itemOrder} onChange={(event) => setItemOrder(event.target.value)} required />
              </label>
              <label className="field toggle-field"><input type="checkbox" checked={itemAvailable} onChange={(event) => setItemAvailable(event.target.checked)} /> Available</label>
            </div>
            <div className="form-actions">
              <Button type="submit" isDisabled={busy || categories.length === 0}>{itemId ? 'Save item' : 'Add item'}</Button>
              {itemId && <button type="button" className="text-button" onClick={resetItem}>Cancel</button>}
            </div>
          </form>
          <div className="list-stack">
            {items.length === 0 && <p className="empty-note">No menu items yet.</p>}
            {items.map((item) => (
              <div className="list-row" key={item.id}>
                <div><strong>{item.name}</strong><small>{categoryNames.get(item.menu_category_id) ?? 'Unknown category'} · {item.is_available ? 'Available' : 'Unavailable'} · {currency} {item.price}</small></div>
                <div className="row-actions">
                  <button type="button" onClick={() => editItem(item)} disabled={busy}>Edit</button>
                  <button type="button" onClick={() => void removeItem(item)} disabled={busy}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

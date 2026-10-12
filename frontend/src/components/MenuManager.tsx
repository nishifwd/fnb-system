import { useState, type FormEvent } from 'react'
import { Button, Switch } from '@heroui/react'
import { api, defaultDrinkOptions, type DrinkOptions, type DrinkSize, type MenuCategory, type MenuItem } from '../api'

type Props = {
  categories: MenuCategory[]
  items: MenuItem[]
  currency: string
  onChanged: () => Promise<void>
}

export function MenuManager({ categories, items, currency, onChanged }: Props) {
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryActive, setCategoryActive] = useState(true)
  const [itemId, setItemId] = useState<number | null>(null)
  const [itemCategoryId, setItemCategoryId] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemAvailable, setItemAvailable] = useState(true)
  const [itemIsDrink, setItemIsDrink] = useState(false)
  const [drinkOptions, setDrinkOptions] = useState<DrinkOptions>(defaultDrinkOptions)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function resetCategory() {
    setCategoryId(null)
    setCategoryName('')
    setCategoryActive(true)
  }

  function resetItem() {
    setItemId(null)
    setItemCategoryId('')
    setItemName('')
    setItemDescription('')
    setItemPrice('')
    setItemAvailable(true)
    setItemIsDrink(false)
    setDrinkOptions(defaultDrinkOptions())
  }

  function editCategory(category: MenuCategory) {
    setCategoryId(category.id)
    setCategoryName(category.name)
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
    setItemAvailable(item.is_available)
    setItemIsDrink(item.is_drink)
    setDrinkOptions(item.drink_options ?? defaultDrinkOptions())
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
        is_drink: itemIsDrink,
        drink_options: itemIsDrink ? drinkOptions : null,
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

  function toggleSize(size: DrinkSize, selected: boolean) {
    setDrinkOptions((current) => ({
      ...current,
      sizes: selected ? [...current.sizes, size] : current.sizes.filter((entry) => entry !== size),
    }))
  }

  const itemsByCategory = new Map(categories.map((category) => [category.id, [] as MenuItem[]]))
  for (const item of items) itemsByCategory.get(item.menu_category_id)?.push(item)

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div><p className="eyebrow">WHAT YOU SERVE</p><h1>Menu management</h1></div>
        <p>Group your menu by category. Add each food or drink where staff will find it.</p>
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
            <Switch isSelected={categoryActive} onChange={setCategoryActive} className="menu-form-switch"><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>Active category</Switch.Content></Switch>
            <div className="form-actions">
              <Button type="submit" isDisabled={busy}>{categoryId ? 'Save category' : 'Add category'}</Button>
              {categoryId && <button type="button" className="text-button" onClick={resetCategory}>Cancel</button>}
            </div>
          </form>
          <div className="list-stack">
            {categories.length === 0 && <p className="empty-note">Add a category to start your menu.</p>}
            {categories.map((category) => (
              <div className="list-row" key={category.id}>
                <div><strong>{category.name}</strong><small>{category.is_active ? 'Active' : 'Hidden'} · {itemsByCategory.get(category.id)?.length ?? 0} items</small></div>
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
              <Switch isSelected={itemAvailable} onChange={setItemAvailable} className="menu-form-switch"><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>Available for orders</Switch.Content></Switch>
              <Switch isSelected={itemIsDrink} onChange={setItemIsDrink} className="drink-switch"><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>Drink</Switch.Content></Switch>
            </div>
            {itemIsDrink && <fieldset className="drink-settings">
              <legend>Choices offered for this drink</legend>
              <p>Standard size is always available. Turn on only the choices you want staff to offer.</p>
              <div className="drink-settings-grid">
                {(['temperature', 'sugar', 'ice'] as const).map((choice) => <Switch key={choice} isSelected={drinkOptions[choice]} onChange={(selected) => setDrinkOptions((current) => ({ ...current, [choice]: selected }))}>
                  <Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>{choice === 'temperature' ? 'Hot or iced' : choice === 'sugar' ? 'Sugar level' : 'Ice level'}</Switch.Content>
                </Switch>)}
                <Switch isSelected={drinkOptions.sizes.includes('small')} onChange={(selected) => toggleSize('small', selected)}><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>Small size</Switch.Content></Switch>
                <Switch isSelected={drinkOptions.sizes.includes('large')} onChange={(selected) => toggleSize('large', selected)}><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>Large size</Switch.Content></Switch>
              </div>
            </fieldset>}
            <div className="form-actions">
              <Button type="submit" isDisabled={busy || categories.length === 0}>{itemId ? 'Save item' : 'Add item'}</Button>
              {itemId && <button type="button" className="text-button" onClick={resetItem}>Cancel</button>}
            </div>
          </form>
          <div className="menu-groups">
            {items.length === 0 && <p className="empty-note">No menu items yet.</p>}
            {categories.map((category) => {
              const categoryItems = itemsByCategory.get(category.id) ?? []
              if (categoryItems.length === 0) return null

              return <section className="menu-group" key={category.id} aria-label={category.name}>
                <div className="menu-group-heading">
                  <h3>{category.name}</h3>
                  <span>{categoryItems.length} items</span>
                </div>
                <div className="list-stack">
                  {categoryItems.map((item) => <div className="list-row" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.is_drink ? 'Drink' : 'Food'} · {item.is_available ? 'Available' : 'Unavailable'} · {currency} {item.price}</small>
                    </div>
                    <div className="row-actions">
                      <button type="button" onClick={() => editItem(item)} disabled={busy}>Edit</button>
                      <button type="button" onClick={() => void removeItem(item)} disabled={busy}>Delete</button>
                    </div>
                  </div>)}
                </div>
              </section>
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Button, Label, Modal, Radio, RadioGroup, TextArea, TextField } from '@heroui/react'
import { defaultDrinkOptions, type DrinkPreparation, type DrinkSize, type ServiceMenuItem } from '../api'

export type CartLine = {
  key: number
  menu_item_id: number
  name: string
  price: number
  quantity: number
  preparation: DrinkPreparation | null
  remark: string | null
}

type Props = {
  item: ServiceMenuItem
  initial?: CartLine
  currency: string
  onClose: () => void
  onSave: (line: Omit<CartLine, 'key'>) => void
}

export function OrderItemCustomizer({ item, initial, currency, onClose, onSave }: Props) {
  const options = item.drink_options ?? defaultDrinkOptions()
  const [temperature, setTemperature] = useState<NonNullable<DrinkPreparation['temperature']>>(initial?.preparation?.temperature ?? 'iced')
  const [sugar, setSugar] = useState<NonNullable<DrinkPreparation['sugar']>>(initial?.preparation?.sugar ?? 'standard')
  const [ice, setIce] = useState<NonNullable<DrinkPreparation['ice']>>(initial?.preparation?.ice ?? 'normal')
  const [size, setSize] = useState<DrinkSize>(initial?.preparation?.size && options.sizes.includes(initial.preparation.size) ? initial.preparation.size : 'standard')
  const [remark, setRemark] = useState(initial?.remark ?? '')
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1)

  function save() {
    const preparation: DrinkPreparation | null = item.is_drink ? {
      temperature: options.temperature ? temperature : null,
      sugar: options.sugar ? sugar : null,
      ice: options.ice && (!options.temperature || temperature === 'iced') ? ice : null,
      size,
    } : null
    onSave({
      menu_item_id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity,
      preparation,
      remark: item.is_drink ? null : (remark.trim() || null),
    })
  }

  return <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose() }}>
    <Modal.Container size="md" placement="center">
      <Modal.Dialog>
        <Modal.CloseTrigger />
        <Modal.Header><Modal.Heading>{initial ? 'Edit item' : 'Add to order'}</Modal.Heading></Modal.Header>
        <Modal.Body>
          <div className="customizer-intro"><strong>{item.name}</strong><span>{currency} {item.price}</span></div>
          {item.is_drink && <div className="drink-options">
            {options.temperature && <RadioGroup value={temperature} onChange={(value) => { if (value === 'hot' || value === 'iced') setTemperature(value) }} name="temperature">
              <Label>Temperature</Label>
              <div className="drink-choice-row">
                {(['hot', 'iced'] as const).map((value) => <Radio key={value} value={value} className="drink-choice">
                  <Radio.Content>{value === 'hot' ? 'Hot' : 'Iced'}</Radio.Content>
                  <Radio.Control><Radio.Indicator /></Radio.Control>
                </Radio>)}
              </div>
            </RadioGroup>}
            {options.sugar && <RadioGroup value={sugar} onChange={(value) => { if (value === 'standard' || value === 'less' || value === 'more') setSugar(value) }} name="sugar">
              <Label>Sugar</Label>
              <div className="drink-choice-row">
                {([['standard', 'Standard'], ['less', 'Less sugar'], ['more', 'More sugar']] as const).map(([value, label]) => <Radio key={value} value={value} className="drink-choice">
                  <Radio.Content>{label}</Radio.Content>
                  <Radio.Control><Radio.Indicator /></Radio.Control>
                </Radio>)}
              </div>
            </RadioGroup>}
            {options.ice && (!options.temperature || temperature === 'iced') && <RadioGroup value={ice} onChange={(value) => { if (value === 'normal' || value === 'less' || value === 'none') setIce(value) }} name="ice">
              <Label>Ice</Label>
              <div className="drink-choice-row">
                {([['normal', 'Normal ice'], ['less', 'Less ice'], ['none', 'No ice']] as const).map(([value, label]) => <Radio key={value} value={value} className="drink-choice">
                  <Radio.Content>{label}</Radio.Content>
                  <Radio.Control><Radio.Indicator /></Radio.Control>
                </Radio>)}
              </div>
            </RadioGroup>}
            {options.sizes.length > 1 ? <RadioGroup value={size} onChange={(value) => { if (value === 'small' || value === 'standard' || value === 'large') setSize(value) }} name="size">
              <Label>Size</Label>
              <div className="drink-choice-row">
                {options.sizes.map((value) => <Radio key={value} value={value} className="drink-choice">
                  <Radio.Content>{value[0].toUpperCase()}{value.slice(1)}</Radio.Content>
                  <Radio.Control><Radio.Indicator /></Radio.Control>
                </Radio>)}
              </div>
            </RadioGroup> : <p className="drink-default-size">Standard size</p>}
          </div>}
          {!item.is_drink && <TextField>
            <Label>Item remark (optional)</Label>
            <TextArea value={remark} onChange={(event) => setRemark(event.target.value)} maxLength={500} rows={3} placeholder="e.g. no onions" />
          </TextField>}
          <div className="customizer-quantity">
            <span>Quantity</span>
            <div>
              <Button variant="secondary" isIconOnly aria-label="Decrease quantity" isDisabled={quantity <= 1} onPress={() => setQuantity((value) => value - 1)}>−</Button>
              <strong>{quantity}</strong>
              <Button variant="secondary" isIconOnly aria-label="Increase quantity" isDisabled={quantity >= 20} onPress={() => setQuantity((value) => value + 1)}>+</Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onPress={onClose}>Cancel</Button>
          <Button onPress={save}>{initial ? 'Save changes' : 'Add item'} · {currency} {(Number(item.price) * quantity).toFixed(2)}</Button>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
}

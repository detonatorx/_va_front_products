export const emptyDish = { name: '', description: '', category: '', image_url: '', price: '', is_active: true, photos: [] };
const currency = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });

export const formatPrice = (kopeks) => currency.format(kopeks / 100);

export function toForm(dish) {
  return {
    name: dish.name, description: dish.description, category: dish.category,
    image_url: dish.image_url, price: (dish.price_kopeks / 100).toFixed(2), is_active: dish.is_active, photos: dish.photos
  };
}

export function parsePrice(value) {
  const price = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(price)) throw new Error('Укажите цену в рублях с точностью до копейки');
  const [rubles, kopeks = ''] = price.split('.');
  const price_kopeks = Number(rubles) * 100 + Number(kopeks.padEnd(2, '0'));
  if (!Number.isSafeInteger(price_kopeks) || price_kopeks > 100000000) throw new Error('Цена слишком велика');
  return price_kopeks;
}

export function toPayload(form) {
  const price_kopeks = parsePrice(form.price);
  return {
    name: form.name, description: form.description, category: form.category,
    image_url: form.image_url, price_kopeks, is_active: form.is_active
  };
}

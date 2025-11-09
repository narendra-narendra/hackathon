export type ShopCategory = 'Gear' | 'Apparel' | 'Recovery' | 'Nutrition'

export interface ShopItem {
  id: string
  name: string
  description: string
  category: ShopCategory
  price: string
  vendor: string
  url: string
  rating: number
  highlight?: string
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'tempo-trainers',
    name: 'Tempo Trainer Earbuds',
    description: 'Sweat-proof earbuds with pass-through mode so you stay aware on group efforts.',
    category: 'Gear',
    price: '$129',
    vendor: 'Shokz',
    url: 'https://shokz.com/',
    rating: 4.8,
    highlight: 'Great for tempo runs'
  },
  {
    id: 'carbon-lace-ups',
    name: 'Carbon Lace-Up Super Trainers',
    description: 'Responsive daily trainer with carbon plate pop for long runs and race-specific workouts.',
    category: 'Apparel',
    price: '$180',
    vendor: 'Tracksmith',
    url: 'https://www.tracksmith.com/',
    rating: 4.6,
    highlight: 'Best for long runs'
  },
  {
    id: 'foam-roller',
    name: 'Infinity Foam Roller',
    description: 'Textured roller to flush legs after hill repeats and heavy gym days.',
    category: 'Recovery',
    price: '$38',
    vendor: 'Rogue Fitness',
    url: 'https://www.roguefitness.com/',
    rating: 4.7
  },
  {
    id: 'electrolyte-mix',
    name: 'Electrolyte Drink Mix Variety Pack',
    description: 'Balanced sodium + potassium blend for long efforts or steamy conditions.',
    category: 'Nutrition',
    price: '$24',
    vendor: 'LMNT',
    url: 'https://drinklmnt.com/',
    rating: 4.9,
    highlight: 'Sugar-free'
  },
  {
    id: 'smart-jacket',
    name: 'All-Weather Reflective Jacket',
    description: 'Lightweight, fully reflective shell with vents for those pre-dawn linkups.',
    category: 'Apparel',
    price: '$160',
    vendor: 'On Running',
    url: 'https://www.on-running.com/',
    rating: 4.5
  },
  {
    id: 'massage-gun',
    name: 'Trigger Pulse Massage Gun',
    description: 'Compact recovery tool with three heads to loosen calves, quads, and shoulders.',
    category: 'Recovery',
    price: '$199',
    vendor: 'Hyperice',
    url: 'https://hyperice.com/',
    rating: 4.4
  }
]

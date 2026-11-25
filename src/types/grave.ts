export type CemeteryZone = 'entrance' | 'new_cemetery' | 'old_cemetery' | 'memorial_garden';

export type GraveStyle = 'classic' | 'obelisk' | 'slab' | 'cross_arch' | 'mossy_stone';

export interface Grave {
  id: string;
  grave_number: number;
  slot_index: number;
  zone: CemeteryZone;
  inscription: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  rotation_y: number;
  grave_style: GraveStyle;
  created_at: string;
  is_demo: boolean;
}

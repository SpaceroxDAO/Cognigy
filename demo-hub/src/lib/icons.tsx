import {
  Heart, Headphones, Shield, DollarSign, Users, Bot, Plane, Settings, Zap, Star,
  Globe, Phone, Mail, Calendar, FileText, Briefcase, Home, Search, Bell, Lock,
  Key, Activity, Camera, Music, Video, Map, Car, Truck, Building, School,
  Hospital, Store, Utensils, Coffee, Code, Database, Cloud, Server, Monitor,
  Smartphone, Laptop, Headset, Mic, Speaker, Wifi, Battery, Power, Lightbulb,
  Sun, Moon, Sparkles, Crown, Award, Trophy, Target, Flag, Gift, ShoppingCart,
  CreditCard, Wallet, Clock, AlertCircle, Check, type LucideProps,
} from 'lucide-react';
import React from 'react';

const iconMap: Record<string, React.FC<LucideProps>> = {
  heart: Heart, headphones: Headphones, shield: Shield, 'dollar-sign': DollarSign,
  users: Users, bot: Bot, plane: Plane, settings: Settings, zap: Zap, star: Star,
  globe: Globe, phone: Phone, mail: Mail, calendar: Calendar, 'file-text': FileText,
  briefcase: Briefcase, home: Home, search: Search, bell: Bell, lock: Lock,
  key: Key, activity: Activity, camera: Camera, music: Music, video: Video,
  map: Map, car: Car, truck: Truck, building: Building, school: School,
  hospital: Hospital, store: Store, utensils: Utensils, coffee: Coffee,
  code: Code, database: Database, cloud: Cloud, server: Server, monitor: Monitor,
  smartphone: Smartphone, laptop: Laptop, headset: Headset, mic: Mic,
  speaker: Speaker, wifi: Wifi, battery: Battery, power: Power, lightbulb: Lightbulb,
  sun: Sun, moon: Moon, sparkles: Sparkles, crown: Crown, award: Award,
  trophy: Trophy, target: Target, flag: Flag, gift: Gift,
  'shopping-cart': ShoppingCart, 'credit-card': CreditCard, wallet: Wallet,
  clock: Clock, 'alert-circle': AlertCircle, check: Check,
};

export const getIcon = (name: string): React.FC<LucideProps> => {
  return iconMap[name.toLowerCase()] || Bot;
};

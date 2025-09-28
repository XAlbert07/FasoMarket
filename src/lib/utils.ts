import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate le prix en remplaçant XOF par F CFA
 * @param price - Le prix en nombre
 * @param currency - La devise (optionnel, défaut: 'XOF')
 * @returns Le prix formaté avec la devise locale
 */
export function formatPrice(price: number, currency: string = 'XOF'): string {
  // Formatage du nombre avec des espaces comme séparateurs de milliers
  const formattedNumber = price.toLocaleString('fr-FR').replace(/,/g, ' ');
  
  // Remplacement de XOF par F CFA pour un affichage plus local
  if (currency === 'XOF') {
    return `${formattedNumber} F CFA`;
  }
  
  return `${formattedNumber} ${currency}`;
}

/**
 * Détermine si une annonce est considérée comme "nouvelle"
 * Une annonce est nouvelle si elle a été créée il y a moins de 48 heures
 * @param createdAt - La date de création de l'annonce
 * @returns true si l'annonce est nouvelle, false sinon
 */
export function isListingNew(createdAt: string): boolean {
  const creationDate = new Date(createdAt);
  const now = new Date();
  const timeDifference = now.getTime() - creationDate.getTime();
  const hoursInMilliseconds = 48 * 60 * 60 * 1000; // 48 heures en millisecondes
  
  return timeDifference < hoursInMilliseconds;
}

/**
 * Formate une date relative en français (il y a X temps)
 * @param date - La date à formater
 * @returns Une chaîne décrivant le temps écoulé depuis la date
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const timeDifference = now.getTime() - targetDate.getTime();
  
  // Conversion en différentes unités
  const minutes = Math.floor(timeDifference / (1000 * 60));
  const hours = Math.floor(timeDifference / (1000 * 60 * 60));
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  // Logique de formatage basée sur le temps écoulé
  if (minutes < 1) {
    return "À l'instant";
  } else if (minutes < 60) {
    return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (hours < 24) {
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  } else if (days < 7) {
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  } else if (weeks < 4) {
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  } else if (months < 12) {
    return `Il y a ${months} mois`;
  } else {
    return `Il y a ${years} an${years > 1 ? 's' : ''}`;
  }
}

/**
 * Formate le nombre de vues de manière lisible
 * @param views - Le nombre de vues
 * @returns Le nombre de vues formaté (ex: "1.2k" pour 1200)
 */
export function formatViewsCount(views: number): string {
  if (views < 1000) {
    return `${views}`;
  } else if (views < 1000000) {
    const kViews = (views / 1000).toFixed(1).replace('.0', '');
    return `${kViews}k`;
  } else {
    const mViews = (views / 1000000).toFixed(1).replace('.0', '');
    return `${mViews}M`;
  }
}
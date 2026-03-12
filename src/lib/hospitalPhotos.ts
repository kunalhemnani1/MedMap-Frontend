export const HOSPITAL_PHOTOS = [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
    "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&q=80",
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=80",
    "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=600&q=80",
    "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=600&q=80",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80",
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&q=80",
    "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=600&q=80",
    "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&q=80",
    "https://images.unsplash.com/photo-1563213126-a4273aed2016?w=600&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&q=80",
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80",
];

/** Deterministically picks a photo for a hospital so the same ID always gets the same photo. */
export function getHospitalPhoto(id: string | number): string {
    const str = String(id);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return HOSPITAL_PHOTOS[hash % HOSPITAL_PHOTOS.length];
}

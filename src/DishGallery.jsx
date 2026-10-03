import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { photoSource } from './api.js';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function DishGallery({ photos = [], name, large = false }) {
  if (!photos.length) return <div className="gallery-placeholder" aria-label="Фото пока нет">К</div>;
  return <Swiper key={photos.map((photo) => photo.id).join(':')} className={large ? 'dish-gallery large' : 'dish-gallery'}
    modules={[Autoplay, Navigation, Pagination]} slidesPerView={1} loop={photos.length > 1}
    autoplay={photos.length > 1 ? { delay: 3000, disableOnInteraction: false } : false}
    pagination={photos.length > 1 ? { clickable: true } : false} navigation={large && photos.length > 1}>
    {photos.map((photo, index) => <SwiperSlide key={photo.id}><img src={photoSource(photo.url)} alt={`${name} — фото ${index + 1}`} loading={index ? 'lazy' : 'eager'} /></SwiperSlide>)}
  </Swiper>;
}

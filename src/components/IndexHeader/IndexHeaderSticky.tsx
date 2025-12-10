import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Mousewheel } from 'swiper/modules'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import type { Swiper as SwiperType } from 'swiper'
import styles from './IndexHeaderSticky.module.scss'
import { PAGE_ENDPOINTS } from '@constants/'
import { GlassCard } from '@developer-hub/liquid-glass'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/mousewheel'

interface IndexHeaderStickyProps {
  isAuthenticated: boolean
  openAuthModal: (type: 'login' | 'register') => void
}

const NAV_LINKS = [
  { id: 1, href: '#products', label: 'Продукты' },
  { id: 2, href: '#innovations', label: 'Инновации' },
  { id: 3, href: '#pricing', label: 'Цены' },
  { id: 4, href: '#documentation', label: 'Документация' },
  { id: 5, href: '#about', label: 'О нас' },
  { id: 6, href: '#contacts', label: 'Контакты' },
  { id: 7, href: '#blog', label: 'Блог' },
  { id: 8, href: '#support', label: 'Поддержка' },
]

export const IndexHeaderSticky = ({
  isAuthenticated,
  openAuthModal,
}: IndexHeaderStickyProps) => {
  const navigate = useNavigate()
  const swiperRef = useRef<SwiperType | null>(null)
  const [showCarousel, setShowCarousel] = useState(false)
  const navLinksRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkLayout = () => {
      const width = window.innerWidth

      if (width >= 900 && width <= 1650) {
        setShowCarousel(true)
      } else {
        setShowCarousel(false)
      }
    }

    checkLayout()
    window.addEventListener('resize', checkLayout)

    const timer = setTimeout(checkLayout, 100)

    return () => {
      window.removeEventListener('resize', checkLayout)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className={styles.stickyContainer}>
      <GlassCard
        className={styles.glassWrapper}
        displacementScale={65}
        blurAmount={0.01}
        cornerRadius={60}
      >
        <div className={styles.indexHeader}>
          <img
            className={styles.indexLogo}
            src="/images/logo_dark.png"
            alt="YAMP logo"
            onClick={() => (window.location.hash = '#introduction')}
          />

          <div ref={containerRef} className={styles.navContainer}>
            <div
              ref={navLinksRef}
              className={styles.longreadNavLinks}
              style={{
                display: showCarousel ? 'none' : 'flex',
              }}
            >
              {NAV_LINKS.map((link) => (
                <a key={link.id} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>

            {showCarousel && (
              <div className={styles.carouselWrapper}>
                <button
                  className={styles.navButtonPrev}
                  onClick={() => swiperRef.current?.slidePrev()}
                  aria-label="Предыдущий слайд"
                >
                  <FaChevronLeft />
                </button>

                <Swiper
                  modules={[Navigation, Mousewheel]}
                  slidesPerView="auto"
                  centeredSlides={false}
                  freeMode={true}
                  mousewheel={{
                    forceToAxis: true,
                    sensitivity: 1,
                  }}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper
                  }}
                  className={styles.swiperContainer}
                >
                  {NAV_LINKS.map((link) => (
                    <SwiperSlide
                      key={link.id}
                      className={styles.swiperSlide}
                      style={{
                        width: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <a href={link.href}>{link.label}</a>
                    </SwiperSlide>
                  ))}
                </Swiper>

                <button
                  className={styles.navButtonNext}
                  onClick={() => swiperRef.current?.slideNext()}
                  aria-label="Следующий слайд"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>

          <div className={styles.indexLogin}>
            <button
              className={styles.indexLoginBtn}
              onClick={() => {
                if (isAuthenticated) {
                  navigate(`${PAGE_ENDPOINTS.OUTLET}/${PAGE_ENDPOINTS.HOME}`)
                } else {
                  openAuthModal('login')
                }
              }}
            >
              Личный кабинет
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

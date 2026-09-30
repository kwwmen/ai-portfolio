/**
 * Единственная точка конфигурации проекта.
 * Меняйте здесь пути и режимы — компоненты трогать не нужно.
 */
export const CONFIG = {
  /** Каталог с JSON-данными (относительно корня сайта) */
  dataDir: 'data/',

  /**
   * Откуда брать фото кейсов:
   *   'local'  — assets/img/cases/... (рекомендуется)
   *   'yandex' — через публичный API Яндекс Диска (есть лимиты, см. README)
   */
  mediaSource: 'local',

  yandex: {
    publicKey: '',
    cacheTtlMs: 1000 * 60 * 60
  },

  youtube: {
    host: 'https://www.youtube-nocookie.com',
    params: 'autoplay=1&rel=0&modestbranding=1&playsinline=1'
  },

  /** true = показывать кейсы с status:"demo" */
  showDemo: true
};

/**
 * Настройки проекта. Всё, что можно менять без правки компонентов.
 */
export const CONFIG = {
  /** Каталог с JSON-данными (относительно корня сайта) */
  dataDir: 'data/',

  /**
   * Фото кейсов:
   *   'local'  — assets/img/cases/... (рекомендуется)
   *   'yandex' — публичный API Яндекс Диска (есть лимиты, см. README)
   */
  mediaSource: 'local',

  yandex: {
    publicKey: '',
    cacheTtlMs: 1000 * 60 * 60
  },

  /**
   * Порядок источников видео. Первый доступный становится основным,
   * остальные показываются ссылками «Не открывается?» под плеером.
   *
   * mp4     — свой файл в репозитории. Работает всегда и у всех.
   * rutube  — без VPN, российский.
   * vk      — без VPN, российский.
   * youtube — запасной.
   *
   * Поставьте 'mp4' первым, когда выложите файлы в assets/video/.
   */
  videoOrder: ['mp4', 'rutube', 'vk', 'youtube'],

  /** Ограничение размера видео для <video>, МБ (защита от случайных гигантов) */
  maxLocalVideoMb: 40,

  /**
   * Параметры встраивания YouTube.
   * rel=0            — не показывать чужие ролики в конце
   * modestbranding=1 — убрать логотип YouTube из плеера
   * playsinline=1    — не разворачивать на весь экран на iOS самовольно
   */
  youtube: {
    host: 'https://www.youtube-nocookie.com',
    params: 'autoplay=1&rel=0&modestbranding=1&playsinline=1'
  },

  /** true = показывать кейсы со status:"demo" */
  showDemo: true
};

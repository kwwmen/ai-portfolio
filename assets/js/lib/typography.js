/**
 * Русская типографика.
 *
 * Две задачи:
 *   1. Не давать коротким словам оставаться в конце строки
 *      («в», «на», «и», «не» — они должны держаться следующего слова).
 *   2. Привязывать единицы к числам и знак ₽ к сумме.
 *
 * Делается заменой обычного пробела на неразрывный (U+00A0).
 * Это чистая типографика — текст и SEO не страдают.
 */

/* Предлоги, союзы, частицы — не переносятся на новую строку в одиночку */
const SHORT_WORDS = [
  // предлоги
  'без','близ','в','вне','во','вокруг','для','до','за','из','из-за','из-под',
  'к','ко','кроме','меж','между','на','над','о','об','обо','от','перед','по',
  'под','при','про','ради','с','со','среди','у','через',
  // союзы
  'а','будто','ведь','да','если','и','или','либо','но','однако','пока','чтобы',
  // частицы и короткие слова
  'бы','был','была','было','были','будет','вот','все','всё','всех','даже','же',
  'ещё','еще','его','её','ее','их','как','ли','лишь','мне','на','нам','нас','не',
  'нет','ни','ним','них','ну','он','она','они','оно','после','то','тоже','уже',
  'хоть','чем','что','это','я'
];

/* Слова сортируем по убыванию длины: «чтобы» должно сработать раньше «что» */
const PATTERN = new RegExp(
  '(^|[\\s(\\u00A0])(' + SHORT_WORDS.slice().sort((a, b) => b.length - a.length)
    .map(w => w.replace('-', '\\-'))
    .join('|') + ')([ \\t]+)(?=\\S)',
  'gi'
);

/* Число + единица: «2 000 ₽», «15 секунд», «4-5 фотографий» */
const NUM_UNIT = /(\d+)[ \t]+(?=₽|руб|р\.|%|сек|секунд|мин|минут|фото|фотограф|шт|дней|дня|часа?\b|тыс)/gi;

/* Разряды числа: «2 000» → «2 000» неразрывным */
const DIGITS = /(\d)[ \t]+(?=\d{3}\b)/g;

/**
 * Применяет правила к строке.
 * @param {string} text
 * @returns {string}
 */
export function typo(text) {
  if (typeof text !== 'string' || !text) return text || '';

  let out = text;

  out = out.replace(PATTERN, (m, pre, word, space) => pre + word + '\u00A0');
  out = out.replace(NUM_UNIT, '$1\u00A0');
  out = out.replace(DIGITS, '$1\u00A0');

  /* Тире прилипает к предыдущему слову, но отбивается от следующего */
  out = out.replace(/[ \t]+—[ \t]*/g, '\u00A0— ');

  return out;
}

/**
 * Прогоняет все текстовые узлы внутри элемента.
 * Вызывается один раз на контейнер, после вставки контента.
 * @param {HTMLElement|Document} root
 */
export function typeset(root = document) {
  if (!root) return;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        /* Не трогаем код, скрипты и поля ввода */
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'TEXTAREA') {
          return NodeFilter.FILTER_REJECT;
        }

        return /\S/.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(node => {
    const fixed = typo(node.nodeValue);
    if (fixed !== node.nodeValue) node.nodeValue = fixed;
  });
}

import { combineExtensions, combineHtmlExtensions } from 'micromark-util-combine-extensions';

import { pedanticEmphasisMicromarkHtml, pedanticEmphasisMicromark, pedanticEmphasisFromMarkdown, pedanticEmphasisToMarkdown } from './pedantic-emphasis.js';
import { pedanticStrongMicromarkHtml  , pedanticStrongMicromark  , pedanticStrongFromMarkdown  , pedanticStrongToMarkdown   } from './pedantic-strong.js';

export {
  pedanticEmphasisMicromarkHtml, pedanticEmphasisMicromark, pedanticEmphasisFromMarkdown, pedanticEmphasisToMarkdown,
  pedanticStrongMicromarkHtml  , pedanticStrongMicromark  , pedanticStrongFromMarkdown  , pedanticStrongToMarkdown
};

// NOTE : https://github.com/micromark/micromark-extension-gfm/blob/main/index.js
export function micromarkExtensionPedantic() {
  return combineExtensions([
    pedanticEmphasisMicromark(),
    pedanticStrongMicromark()
  ]);
}
export function micromarkExtensionPedanticHtml() {
  return combineHtmlExtensions([
    pedanticEmphasisMicromarkHtml,
    pedanticStrongMicromarkHtml
  ]);
}

// NOTE : https://github.com/syntax-tree/mdast-util-gfm/blob/main/lib/index.js
export function mdastUtilPedanticFromMarkdown() {
  return [
    pedanticEmphasisFromMarkdown,
    pedanticStrongFromMarkdown
  ];
}
export function mdastUtilPedanticToMarkdown() {
  return { extensions: [
    pedanticEmphasisToMarkdown,
    pedanticStrongToMarkdown
  ] };
}

// NOTE : https://github.com/remarkjs/remark-gfm/blob/main/index.js
export default function remarkPedantic() {
  const data = this.data();
  add('micromarkExtensions', micromarkExtensionPedantic());
  add('fromMarkdownExtensions', mdastUtilPedanticFromMarkdown());
  add('toMarkdownExtensions', mdastUtilPedanticToMarkdown());
  
  function add(field, value) {
    const list = (data[field] ? data[field] : (data[field] = []));
    list.push(value);
  }
}

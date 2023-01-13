// micromark-extension : https://github.com/micromark/micromark-extension-gfm-strikethrough/blob/main/dev/index.js
import { splice } from 'micromark-util-chunked';
import { classifyCharacter } from 'micromark-util-classify-character';
import { resolveAll } from 'micromark-util-resolve-all';
import { codes } from 'micromark-util-symbol/codes.js';
import { constants } from 'micromark-util-symbol/constants.js';
import { types } from 'micromark-util-symbol/types.js';
// mdast-util : https://github.com/syntax-tree/mdast-util-gfm-strikethrough/blob/main/index.js
import { containerPhrasing } from 'mdast-util-to-markdown/lib/util/container-phrasing.js'
import { track } from 'mdast-util-to-markdown/lib/util/track.js'

/**
 * HTML extension for micromark (passed in `htmlExtensions`).
 * 
 * @type {HtmlExtension}
 */
export const pedanticEmphasisMicromarkHtml = {
  enter: { pedanticEmphasis() { this.tag('<em>' ); } },
  exit : { pedanticEmphasis() { this.tag('</em>'); } }
};

/**
 * Function that can be called to get a syntax extension for micromark (passed in `extensions`).
 * 
 * @return {Extension} Syntax extension for micromark (passed in `extensions`).
 */
export function pedanticEmphasisMicromark() {
  const tokenizer = {
    tokenize  : tokenizePedantic,
    resolveAll: resolveAllPedantic
  };
  return {
    text: { [codes.underscore]: tokenizer },
    insideSpan: { null: [tokenizer] },
    attentionMarkers: { null: [codes.underscore] }
  };
  
  /** Take events and resolve pedantic. */
  function resolveAllPedantic(events, context) {
    let index = -1;
    while(++index < events.length) {  // Walk through all events.
      // Find a token that can close.
      if(
        events[index][0] === 'enter' &&
        events[index][1].type === 'pedanticEmphasisSequenceTemporary' &&
        events[index][1]._close
      ) {
        let open = index;
        // Now walk back to find an opener.
        while(open--) {
          // Find a token that can open the closer.
          if(
            events[open][0] === 'exit' &&
            events[open][1].type === 'pedanticEmphasisSequenceTemporary' &&
            events[open][1]._open &&
            events[index][1].end.offset - events[index][1].start.offset === events[open][1].end.offset - events[open][1].start.offset  // If the sizes are the same:
          ) {
            events[index][1].type = 'pedanticEmphasisSequence';
            events[open ][1].type = 'pedanticEmphasisSequence';
            const pedantic = {
              type : 'pedanticEmphasis',
              start: Object.assign({}, events[open][1].start),
              end  : Object.assign({}, events[index][1].end)
            };
            const text = {
              type : 'pedanticEmphasisText',
              start: Object.assign({}, events[open][1].end),
              end  : Object.assign({}, events[index][1].start)
            };
            // Opening.
            const nextEvents = [
              ['enter', pedantic, context],
              ['enter', events[open][1], context],
              ['exit' , events[open][1], context],
              ['enter', text, context]
            ];
            // Between.
            splice(
              nextEvents,
              nextEvents.length,
              0,
              resolveAll(
                context.parser.constructs.insideSpan.null,
                events.slice(open + 1, index),
                context
              )
            );
            // Closing.
            splice(nextEvents, nextEvents.length, 0, [
              ['exit' , text, context],
              ['enter', events[index][1], context],
              ['exit' , events[index][1], context],
              ['exit' , pedantic, context]
            ]);
            splice(events, open - 1, index - open + 3, nextEvents);
            index = open + nextEvents.length - 2;
            break;
          }
        }
      }
    }
    index = -1;
    while(++index < events.length) {
      if(events[index][1].type === 'pedanticEmphasisSequenceTemporary') events[index][1].type = types.data;
    }
    return events;
  }
  
  function tokenizePedantic(effects, ok, nok) {
    const previous = this.previous;
    const events = this.events;
    let size = 0;
    return start;
    
    function start(code) {
      if(code !== codes.underscore) throw new Error('expected `_`');
      if(
        previous === codes.underscore &&
        events[events.length - 1][1].type !== types.characterEscape
      ) return nok(code);
      effects.enter('pedanticEmphasisSequenceTemporary');
      return more(code);
    }
    
    function more(code) {
      const before = classifyCharacter(previous);
      if(code === codes.underscore) {
        if(size > 1) return nok(code);  // If this is the third marker, exit.
        effects.consume(code);
        size++;
        return more;
      }
      // Emphasis
      const token = effects.exit('pedanticEmphasisSequenceTemporary');
      const after = classifyCharacter(code);
      token._open  = !after  || (after  === constants.attentionSideAfter && Boolean(before));
      token._close = !before || (before === constants.attentionSideAfter && Boolean(after));
      return ok(code);
    }
  }
}

/** @type {FromMarkdownExtension} */
export const pedanticEmphasisFromMarkdown = {
  canContainEols: ['emphasis'],
  enter: { pedanticEmphasis: function enterPedanticEmphasis(token) { this.enter({ type: 'emphasis', children: [] }, token); } },
  exit : { pedanticEmphasis: function exitPedanticEmphasis (token) { this.exit(token); } }
};

/** @type {ToMarkdownExtension} */
export const pedanticEmphasisToMarkdown = {
  unsafe: [{
    character: '_',
    inConstruct: 'phrasing',
    //  List of constructs that occur in phrasing (paragraphs, headings), but cannot contain pedantics. So they sort of cancel each other out.
    // Note: keep in sync with: <https://github.com/syntax-tree/mdast-util-to-markdown/blob/c47743b/lib/unsafe.js#L11>
    notInConstruct: [
      'autolink',
      'destinationLiteral',
      'destinationRaw',
      'reference',
      'titleQuote',
      'titleApostrophe'
    ]
  }],
  handlers: {
    /** @type {ToMarkdownHandle} */
    emphasis: function handleEmphasis(node, _, context, safeOptions) {
      const tracker = track(safeOptions);
      const exit = context.enter('emphasis');
      let value = tracker.move('_');
      value += containerPhrasing(node, context, {
        ...tracker.current(),
        before: value,
        after: '_'
      });
      value += tracker.move('_');
      exit();
      return value;
    }
  },
  peek: function peekEmphasis() { return '_'; }
};

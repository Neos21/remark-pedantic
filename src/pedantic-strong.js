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
export const pedanticStrongMicromarkHtml = {
  enter: { pedanticStrong() { this.tag('<strong>' ); } },
  exit : { pedanticStrong() { this.tag('</strong>'); } }
};

/**
 * Function that can be called to get a syntax extension for micromark (passed in `extensions`).
 * 
 * @return {Extension} Syntax extension for micromark (passed in `extensions`).
 */
export function pedanticStrongMicromark() {
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
        events[index][1].type === 'pedanticStrongSequenceTemporary' &&
        events[index][1]._close
      ) {
        let open = index;
        // Now walk back to find an opener.
        while(open--) {
          // Find a token that can open the closer.
          if(
            events[open][0] === 'exit' &&
            events[open][1].type === 'pedanticStrongSequenceTemporary' &&
            events[open][1]._open &&
            events[index][1].end.offset - events[index][1].start.offset === events[open][1].end.offset - events[open][1].start.offset  // If the sizes are the same:
          ) {
            events[index][1].type = 'pedanticStrongSequence';
            events[open ][1].type = 'pedanticStrongSequence';
            const pedantic = {
              type : 'pedanticStrong',
              start: Object.assign({}, events[open][1].start),
              end  : Object.assign({}, events[index][1].end)
            };
            const text = {
              type : 'pedanticStrongText',
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
      if(events[index][1].type === 'pedanticStrongSequenceTemporary') events[index][1].type = types.data;
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
      effects.enter('pedanticStrongSequenceTemporary');
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
      if(size < 2) return nok(code);  // Strong
      const token = effects.exit('pedanticStrongSequenceTemporary');
      const after = classifyCharacter(code);
      token._open  = !after  || (after  === constants.attentionSideAfter && Boolean(before));
      token._close = !before || (before === constants.attentionSideAfter && Boolean(after));
      return ok(code);
    }
  }
}

/** @type {FromMarkdownExtension} */
export const pedanticStrongFromMarkdown = {
  canContainEols: ['strong'],
  enter: { pedanticStrong: function enterPedanticStrong(token) { this.enter({ type: 'strong', children: [] }, token); } },
  exit : { pedanticStrong: function exitPedanticStrong (token) { this.exit(token); } }
};

/** @type {ToMarkdownExtension} */
export const pedanticStrongToMarkdown = {
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
    strong: function handleStrong(node, _, context, safeOptions) {
      const tracker = track(safeOptions);
      const exit = context.enter('strong');
      let value = tracker.move('__');
      value += containerPhrasing(node, context, {
        ...tracker.current(),
        before: value,
        after: '_'
      });
      value += tracker.move('__');
      exit();
      return value;
    }
  },
  peek: function peekStrong() { return '_'; }
};

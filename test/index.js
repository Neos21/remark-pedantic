import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import remarkPedantic, {
  pedanticEmphasisMicromarkHtml, pedanticEmphasisMicromark, pedanticEmphasisFromMarkdown, pedanticEmphasisToMarkdown,
  pedanticStrongMicromarkHtml  , pedanticStrongMicromark  , pedanticStrongFromMarkdown  , pedanticStrongToMarkdown,
  micromarkExtensionPedantic   , micromarkExtensionPedanticHtml,
  mdastUtilPedanticFromMarkdown, mdastUtilPedanticToMarkdown
} from '../src/index.js';

const processor = unified()
  .use(remarkParse)
  //.use((node) => { console.log(JSON.stringify(node, null, '  ')); })
  .use(remarkPedantic)
  .use(remarkRehype)
  .use(rehypeStringify);

let succeeded = 0;
let failed    = 0;
const testNotEmpty = (testName, testValue) => {
  if(testValue == null) {
    console.error(`[${testName}] Failed : [${testValue}] is not null or undefined`);
    ++failed;
    return;
  }
  ++succeeded;
};
const testToEquals = (testName, testValue, expectedValue) => {
  const value = processor.processSync(testValue).value.replace((/\n/g), '');
  if(value !== expectedValue) {
    console.error(`[${testName}] Failed : [${value}] ... [${expectedValue}]`);
    ++failed;
    return;
  }
  ++succeeded;
};

testNotEmpty('pedanticEmphasisMicromarkHtml' , pedanticEmphasisMicromarkHtml);
testNotEmpty('pedanticEmphasisMicromark'     , pedanticEmphasisMicromark);
testNotEmpty('pedanticEmphasisFromMarkdown'  , pedanticEmphasisFromMarkdown);
testNotEmpty('pedanticEmphasisToMarkdown'    , pedanticEmphasisToMarkdown);
testNotEmpty('pedanticStrongMicromarkHtml'   , pedanticStrongMicromarkHtml);
testNotEmpty('pedanticStrongMicromark'       , pedanticStrongMicromark);
testNotEmpty('pedanticStrongFromMarkdown'    , pedanticStrongFromMarkdown);
testNotEmpty('pedanticStrongToMarkdown'      , pedanticStrongToMarkdown);
testNotEmpty('micromarkExtensionPedantic'    , micromarkExtensionPedantic);
testNotEmpty('micromarkExtensionPedanticHtml', micromarkExtensionPedanticHtml);
testNotEmpty('mdastUtilPedanticFromMarkdown' , mdastUtilPedanticFromMarkdown);
testNotEmpty('mdastUtilPedanticToMarkdown'   , mdastUtilPedanticToMarkdown);

testToEquals('Emphasis 01', 'Test_Test_Test'             , '<p>Test<em>Test</em>Test</p>');
testToEquals('Emphasis 02', 'テスト_テスト_テスト'       , '<p>テスト<em>テスト</em>テスト</p>');
testToEquals('Emphasis 03', '# Test_Test_Test'           , '<h1>Test<em>Test</em>Test</h1>');
testToEquals('Emphasis 04', '## テスト_テスト_テスト'    , '<h2>テスト<em>テスト</em>テスト</h2>');
testToEquals('Emphasis 06', '- Test_Test_Test'           , '<ul><li>Test<em>Test</em>Test</li></ul>');
testToEquals('Emphasis 07', '- テスト_テスト_テスト'     , '<ul><li>テスト<em>テスト</em>テスト</li></ul>');
testToEquals('Emphasis 08', 'Test[Test_Test_Test](/)Test', '<p>Test<a href="/">Test<em>Test</em>Test</a>Test</p>');
testToEquals('Emphasis 09', 'Test_Test[Test](/)Test_Test', '<p>Test<em>Test<a href="/">Test</a>Test</em>Test</p>');
testToEquals('Emphasis 10', 'Test[_Test_](/)Test'        , '<p>Test<a href="/"><em>Test</em></a>Test</p>');
testToEquals('Emphasis 11', 'Test_[Test](/)_Test'        , '<p>Test<em><a href="/">Test</a></em>Test</p>');        // TODO : 変換できない
testToEquals('Emphasis 12', 'テスト_[テスト](/)_テスト'  , '<p>テスト<em><a href="/">テスト</a></em>テスト</p>');  // TODO : 変換できない
testToEquals('Emphasis 13', 'テスト _[テスト](/)_ テスト', '<p>テスト <em><a href="/">テスト</a></em> テスト</p>');
testToEquals('Emphasis 14', 'Test`_Test_`Test'           , '<p>Test<code>_Test_</code>Test</p>');
testToEquals('Emphasis 15', 'Test_`Test`_Test'           , '<p>Test<em><code>Test</code></em>Test</p>');           // TODO : 変換できない
testToEquals('Emphasis 16', 'Test _`Test`_ Test'         , '<p>Test <em><code>Test</code></em> Test</p>');

testToEquals('Strong 01', 'Test__Test__Test'         , '<p>Test<strong>Test</strong>Test</p>');
testToEquals('Strong 02', 'テスト__テスト__テスト'   , '<p>テスト<strong>テスト</strong>テスト</p>');
testToEquals('Strong 03', '# Test__Test__Test'       , '<h1>Test<strong>Test</strong>Test</h1>');
testToEquals('Strong 04', '## テスト__テスト__テスト', '<h2>テスト<strong>テスト</strong>テスト</h2>');
testToEquals('Strong 06', '- Test__Test__Test'       , '<ul><li>Test<strong>Test</strong>Test</li></ul>');
testToEquals('Strong 07', '- テスト__テスト__テスト' , '<ul><li>テスト<strong>テスト</strong>テスト</li></ul>');
testToEquals('Strong 08', 'Test[Test__Test__Test](/)Test', '<p>Test<a href="/">Test<strong>Test</strong>Test</a>Test</p>');
testToEquals('Strong 09', 'Test__Test[Test](/)Test__Test', '<p>Test<strong>Test<a href="/">Test</a>Test</strong>Test</p>');
testToEquals('Strong 10', 'Test[__Test__](/)Test'        , '<p>Test<a href="/"><strong>Test</strong></a>Test</p>');
testToEquals('Strong 11', 'Test__[Test](/)__Test'        , '<p>Test<strong><a href="/">Test</a></strong>Test</p>');        // TODO : 変換できない
testToEquals('Strong 12', 'テスト__[テスト](/)__テスト'  , '<p>テスト<strong><a href="/">テスト</a></strong>テスト</p>');  // TODO : 変換できない
testToEquals('Strong 13', 'テスト __[テスト](/)__ テスト', '<p>テスト <strong><a href="/">テスト</a></strong> テスト</p>');
testToEquals('Strong 14', 'Test`__Test__`Test'           , '<p>Test<code>__Test__</code>Test</p>');
testToEquals('Strong 15', 'Test__`Test`__Test'           , '<p>Test<strong><code>Test</code></strong>Test</p>');           // TODO : 変換できない
testToEquals('Strong 15', 'Test __`Test`__ Test'         , '<p>Test <strong><code>Test</code></strong> Test</p>');

console.log('--------------');
console.log(`Total     : ${succeeded + failed}`);
console.log(`Succeeded : ${succeeded}`);
console.log(`Failed    : ${failed}`);
console.log('--------------');
if(failed >= 1) process.exit(1);

# EngForge 原型改造提示词 v2（修订版）

---

## 任务目标

现有文件 `EngForge_原型.html` 是一个英语写作工坊的交互原型。目前存在两个硬编码问题：

1. **数据不持久**：刷新页面后所有状态（Fork 次数、修改历史、编辑器内容、版本指针）全部归零，重置为代码中的初始值。
2. **AI 标注依赖于预插入的 `<span>` 和硬编码数组**：编辑器内预插入了 4 个 `<span class="ai-span-l1/l2" data-ai-idx="0~3">` 元素，`showPopover()` / `acceptSuggestion()` / `undoModification()` / `toggleAIAnnotations()` 均通过操作这些 span 运行。

任务目标：**在不改变现有 UI 布局和视觉风格的前提下**，完成两项改造：

- **改造 ①**：引入 localStorage 实现数据持久化
- **改造 ②**：将 AI 标注从"预插入 span + 硬编码 aiAnnotations 数组"模式改为"无 span 实时词库扫描"模式

---

## 一、数据持久化（localStorage）实现细则

### 1. 存储 Key

统一使用 `'engforge_data'`。

### 2. 存储的数据结构

```javascript
{
  modificationHistory: [],  // array, each { oldWord, newWord, type, time, context }
  forkCount: 0,            // number
  essayContent: '',        // string (编辑器 #essay-editor 的 innerHTML)
  currentVersion: 'v3',    // string, 当前预览版本
  latestVersion: 'v3',     // string, 最新正式版本（最近一次 restoreVersion 的目标）
  hasMerged: false         // boolean, PR 合并是否已执行
}
```

**注意**：`modificationHistory` 每项新增 `context` 字段（替换位置的前后 20 字符上下文片段）。此字段用于 Part II 中"无 span 模式下的撤销定位"。旧数据中该字段可为空字符串，恢复时做兼容处理。

### 3. 持久化范围边界（重要）

| 持久化 | 说明 |
|---|---|
| ✓ modificationHistory | 每次 AI 替换后保存 |
| ✓ forkCount | 每次 Fork 后保存 |
| ✓ essayContent | 编辑器 #essay-editor 的 innerHTML（防抖 500ms） |
| ✓ currentVersion / latestVersion / hasMerged | restoreVersion 或 mergePR 后保存 |

| 不持久化（保持硬编码） | 说明 |
|---|---|
| ✗ versionArchive 的 v1-v4 内容 | 刷新后恢复为代码中硬编码的版本内容（见原代码第 2532-2540 行） |
| ✗ 编辑器初始 HTML（含旧 span） | 如果 localStorage 中无 essayContent，回退到代码中的默认 innerHTML |

**为什么 versionArchive 不持久化**：versionArchive 是静态演示数据（4 个历史版本的作文内容）。持久化它意味着需要同步维护"写入时的新数据"和"刷新后的硬编码回退"两套逻辑，增加不必要复杂度。仅持久化版本指针状态即可满足"刷新后版本切换器状态不变"的需求。

### 4. 保存逻辑埋点位置

所有保存通过统一函数 `saveData()` 完成：

```javascript
function saveData() {
  var data = {
    modificationHistory: modificationHistory,
    forkCount: forkState.forkCount,
    essayContent: document.getElementById('essay-editor').innerHTML,
    currentVersion: currentVersion,
    latestVersion: latestVersion,
    hasMerged: hasMerged
  };
  localStorage.setItem('engforge_data', JSON.stringify(data));
}
```

**4 个调用位置**：

| 位置 | 行号 | 调用时机 |
|---|---|---|
| `acceptSuggestion` 重写版 | ~3134 | 替换词成功后 |
| `handleFork` | ~2689 | forkState.forkCount++ 之后 |
| `restoreVersion` | ~2609 | latestVersion 更新之后 |
| `#essay-editor` 的 input 事件 | 新增 | 防抖 500ms 后调用 saveData() |

编辑器 input 防抖实现：

```javascript
var essaySaveTimer;
document.getElementById('essay-editor').addEventListener('input', function() {
  clearTimeout(essaySaveTimer);
  essaySaveTimer = setTimeout(saveData, 500);
});
```

### 5. 页面加载恢复逻辑

在 `DOMContentLoaded` 回调或脚本末尾执行：

```javascript
(function restoreFromStorage() {
  var raw = localStorage.getItem('engforge_data');
  if (!raw) return;
  try {
    var data = JSON.parse(raw);

    // A. 恢复变量
    modificationHistory = data.modificationHistory || [];
    forkState.forkCount = data.forkCount || 0;

    // B. 恢复编辑器内容
    var editor = document.getElementById('essay-editor');
    if (editor && data.essayContent) {
      editor.innerHTML = data.essayContent;
    }

    // C. 恢复版本状态
    if (data.currentVersion) currentVersion = data.currentVersion;
    if (data.latestVersion) latestVersion = data.latestVersion;
    if (typeof data.hasMerged !== 'undefined') hasMerged = data.hasMerged;

    // D. 更新 UI
    renderModHistory();
    updateModCount();
    updateVersionPills();
    updateRestoreButton();

    // E. 更新 Dashboard 统计数字（12 + forkCount）
    updateDashboardAfterFork();  // 复用现有函数，但改为：基数 12 + forkState.forkCount
  } catch(e) {
    console.warn('EngForge: localStorage 恢复失败，使用默认数据', e);
  }
})();
```

**修改 `updateDashboardAfterFork()`（~2730行）**：将硬编码的 `animateNumber(statCards[0], 12, 13)` 改为 `animateNumber(statCards[0], 12, 12 + forkState.forkCount)`，同时草稿数也做相应调整。

### 6. 防重复初始化

恢复逻辑需要在 `modificationHistory` 和 `aiAnnotationsOn` 等变量声明之后、`setupAnnotationClickHandlers` 绑定之前执行。建议放在脚本末尾（最后），确保所有 DOM 元素和全局变量已就绪。

---

## 二、动态 AI 标注引擎实现细则

### 2.1 架构变更总览

现有 AI 系统是 **span 驱动** 的。以下 5 个函数需要重写（不是微调）：

| 函数 | 现有逻辑 | 改造方案 |
|---|---|---|
| `toggleAIAnnotations()` (3026行) | 遍历 `.ai-span-l1/l2` span 切换下划线 | 改为切换布尔标志 `aiAnnotationsOn`；关闭时点击不弹 Popover |
| `setupAnnotationClickHandlers()` (3055行) | 检查 `e.target.classList` 是否含 `ai-span-l1/l2` | 改为实时提取点击位置的完整单词 → 查 WORD_SUGGESTIONS 词库 |
| `showPopover()` (3070行) | 从 `span.getAttribute('data-ai-idx')` 查 `aiAnnotations` 数组 | 改为接收动态构造的 ann 对象；定位改为基于 Range 矩形或 click 坐标 |
| `acceptSuggestion()` (3134行) | 接收 `(idxStr, suggestion)`，操作 span 的 textContent 和 class | 改为接收 `suggestion` 仅，使用 Range API 替换文本节点中的词 |
| `undoModification()` (3233行) | 按 `data-ai-idx` + `data-resolved` 属性查找 span 回退 | 改为基于 modificationHistory 中的 context 字段，在编辑器中搜索并替换 |

可以删除或注释掉原有的 `aiAnnotations` 数组（3015-3020行），以及编辑器中预插入的 4 个 span 元素（1961、1963、1965、1967行中的 `<span class="ai-span-...">...</span>`）。

### 2.2 靶词库（放 JS 顶部，变量声明区域之前）

```javascript
const WORD_SUGGESTIONS = {
  // 原形
  'good': { type: 'l1', suggestions: ['beneficial', 'advantageous', 'positive'], reason: '口语化表达，建议使用更正式的形容词' },
  'great': { type: 'l2', suggestions: ['exceptional', 'remarkable', 'unparalleled'], reason: '可用更精准的词汇提升表达层次' },
  'very': { type: 'l1', suggestions: ['extremely', 'profoundly', 'exceedingly'], reason: '"very" 是典型的口语填充词' },
  'really': { type: 'l1', suggestions: ['truly', 'genuinely', 'particularly'], reason: '建议使用更书面化的副词' },
  'important': { type: 'l2', suggestions: ['crucial', 'vital', 'essential', 'paramount'], reason: '可用更高阶词汇' },
  'bad': { type: 'l1', suggestions: ['detrimental', 'harmful', 'adverse'], reason: '过于笼统和口语化' },
  'things': { type: 'l1', suggestions: ['aspects', 'elements', 'factors'], reason: '指代不清，建议用具体名词' },
  'bring': { type: 'l2', suggestions: ['generate', 'produce', 'foster'], reason: '可用更书面化的动词' },
  'people': { type: 'l2', suggestions: ['individuals', 'citizens', 'the public'], reason: '可用更具体的指代' },
  // 词形变化补充（确保现有预置作文中的词能命中）
  'brings': { type: 'l2', suggestions: ['unites', 'draws', 'connects'], reason: '更地道的搭配表达' },
  'creates': { type: 'l2', suggestions: ['generates', 'produces', 'forms'], reason: '可用更书面化的动词' }
};
```

**注意**：
- `brings`（第三人称单数）补充为独立条目，覆盖现有作文中 "social media brings people closer" 的点击。
- `creates` 作为独立单词条目。现有作文中 "creates barriers between" 是短语级标注，新系统只支持单词级。点击 "creates" 单独触发，点击 "barriers" 或 "between" 不触发。
- 匹配时使用 `word.toLowerCase()`，大小写不敏感。

### 2.3 词提取算法（核心技术点）

在 contenteditable 中，点击事件需要从 clientX/clientY 获取点击位置的文本节点和精确的词边界。关键 API 是 `document.caretRangeFromPoint()`（Chrome/Safari）或 `document.caretPositionFromPoint()`（Firefox）。

**实现函数 `getWordAtPoint(x, y)`**：

```javascript
function getWordAtPoint(x, y) {
  // 1. 获取点击位置的 textNode 和 offset
  var range, textNode, offset;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
    if (range) {
      textNode = range.startContainer;
      offset = range.startOffset;
    }
  } else if (document.caretPositionFromPoint) {
    var pos = document.caretPositionFromPoint(x, y);
    if (pos) {
      textNode = pos.offsetNode;
      offset = pos.offset;
    }
  }
  // 若点击位置不是文本节点（如点击了 <br>、空白），返回 null
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null;

  var data = textNode.data;

  // 2. 从 offset 向左遍历，找词起始位置
  var start = offset;
  while (start > 0 && /[a-zA-Z']/.test(data[start - 1])) {
    start--;
  }

  // 3. 从 offset 向右遍历，找词结束位置
  var end = offset;
  while (end < data.length && /[a-zA-Z']/.test(data[end])) {
    end++;
  }

  // 4. 提取单词
  if (end <= start) return null;
  var word = data.substring(start, end);

  // 5. 返回完整信息（包括上下文，用于撤销定位）
  return {
    word: word,                                    // 原始大小写
    textNode: textNode,                            // DOM textNode 引用
    start: start,                                  // 词在 textNode 中的起始偏移
    end: end,                                      // 词在 textNode 中的结束偏移
    context: data.substring(                       // 前后各 20 字符的上下文
      Math.max(0, start - 20),
      Math.min(data.length, end + 20)
    )
  };
}
```

**注意事项**：
- 词边界判断用 `/[a-zA-Z']/`（字母 + 英文撇号），中文、空格、标点均视为边界。
- 如果点击位置在空白、图片或其他非文本元素上，`textNode` 为 null，函数返回 null，调用方静默不弹 Popover。
- `context` 字段长度上限约 45 字符（一个词 + 前后各 20 字符），用于后续撤销时精确定位。

### 2.4 文本替换算法（Range API）

替换词时使用 Range API，避免破坏 contenteditable 的 DOM 结构：

```javascript
function replaceWordInEditor(wordInfo, newWord) {
  var editor = document.getElementById('essay-editor');
  var range = document.createRange();

  // 1. 精确定位原词
  range.setStart(wordInfo.textNode, wordInfo.start);
  range.setEnd(wordInfo.textNode, wordInfo.end);

  // 2. 删除原词 + 插入新词
  range.deleteContents();
  var newTextNode = document.createTextNode(newWord);
  range.insertNode(newTextNode);

  // 3. 合并相邻 textNode（防止 DOM 碎片化）
  editor.normalize();

  // 4. 将光标移到新词末尾
  var newRange = document.createRange();
  newRange.setStartAfter(newTextNode);
  newRange.collapse(true);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(newRange);
}
```

**说明**：
- `editor.normalize()` 是在替换后合并相邻纯文本节点，防止 contenteditable 内部 DOM 碎片化。
- 替换后光标自动移到新词末尾，用户可以继续编辑。
- 不使用 `textNode.data = ...`（简单赋值），因为那样无法正确处理 contenteditable 的撤销栈和光标位置。

### 2.5 重写 `setupAnnotationClickHandlers()`

```javascript
function setupAnnotationClickHandlers() {
  var editor = document.getElementById('essay-editor');
  if (!editor) return;

  editor.addEventListener('click', function(e) {
    // 开关关闭时不处理
    if (!aiAnnotationsOn) return;

    // 提取点击位置的单词
    var wordInfo = getWordAtPoint(e.clientX, e.clientY);
    if (!wordInfo) { closePopover(); return; }

    // 查词库（小写匹配）
    var key = wordInfo.word.toLowerCase();
    if (!WORD_SUGGESTIONS[key]) { closePopover(); return; }

    // 动态构造 ann 对象（等效于原 aiAnnotations 的一行）
    var entry = WORD_SUGGESTIONS[key];
    var ann = {
      word: wordInfo.word,
      type: entry.type,
      suggestions: entry.suggestions,
      reason: entry.reason,
      wordInfo: wordInfo       // 携带位置信息，供 acceptSuggestion 使用
    };

    showPopover(ann, e);
  });
}
```

**关键变化**：
- 不再判断 `e.target.classList.contains('ai-span-l1/l2')`。
- 不再依赖任何预插入的 span。
- 点击非靶词或空白处，静默调用 `closePopover()`。

### 2.6 重写 `showPopover(ann, event)`

```javascript
function showPopover(ann, event) {
  currentPopoverTarget = ann;   // 现在存的是 ann 对象，不是 span

  var popover = document.getElementById('ai-popover');
  var badge = document.getElementById('popover-badge');
  var header = document.getElementById('popover-header');
  var wordLabel = document.getElementById('popover-word-label');
  var reason = document.getElementById('popover-reason');
  var suggestions = document.getElementById('popover-suggestions');

  // 类型标识
  badge.textContent = ann.type === 'l1' ? 'L1 错误' : 'L2 升级';
  badge.className = 'ai-popover-type-badge ' + ann.type;
  header.className = 'ai-popover-header ' + ann.type;
  wordLabel.textContent = '\u201C' + ann.word + '\u201D ' + (ann.type === 'l1' ? '可优化' : '可升级');
  reason.textContent = ann.reason;

  // 建议词列表（回调改为只传 suggestion，不再传 idxStr）
  var chipsHTML = '';
  ann.suggestions.forEach(function(word) {
    chipsHTML += '<div class="ai-suggestion-chip" onclick="acceptSuggestion(\'' + escapeHTML(word) + '\')"><span class="chip-replace-icon">\u2192</span>' + word + '</div>';
  });
  suggestions.innerHTML = chipsHTML;

  popover.style.display = 'block';

  // 定位：优先使用 Range 矩形，回退到点击坐标
  requestAnimationFrame(function() {
    var editorBody = document.querySelector('#screen-editor .editor-body');
    var editorRect = editorBody.getBoundingClientRect();
    var popoverWidth = popover.offsetWidth;

    // 尝试从 wordInfo 获取位置（如果在 click 回调中已保存 range）
    var left, top;
    if (ann.wordInfo._rangeRect) {
      left = ann.wordInfo._rangeRect.left - editorRect.left + (ann.wordInfo._rangeRect.width / 2) - (popoverWidth / 2);
      top = ann.wordInfo._rangeRect.bottom - editorRect.top + 6;
    } else {
      left = event.clientX - editorRect.left - (popoverWidth / 2);
      top = event.clientY - editorRect.top + 18;
    }

    if (left < 8) left = 8;
    if (left + popoverWidth > editorRect.width - 8) left = editorRect.width - popoverWidth - 8;

    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
  });
}
```

**关键变化**：
- 参数从 `(span, event)` 改为 `(ann, event)`。
- `currentPopoverTarget` 不再存 span 引用，改为存 ann 对象。
- 定位改为基于 `event.clientX/Y` 计算（不再依赖 span 的 `getBoundingClientRect()`），因为不再有 span。
- Popover 的 HTML 结构和 CSS class 完全不变（`#ai-popover`、`.ai-popover-header`、`#popover-badge` 等）。

### 2.7 重写 `acceptSuggestion(suggestion)` （重要：参数变化）

```javascript
function acceptSuggestion(suggestion) {
  var ann = currentPopoverTarget;
  if (!ann || !ann.wordInfo) return;

  var oldWord = ann.word;
  var wordInfo = ann.wordInfo;
  var type = ann.type;

  // 1. 使用 Range API 替换文本
  var editor = document.getElementById('essay-editor');
  var range = document.createRange();
  range.setStart(wordInfo.textNode, wordInfo.start);
  range.setEnd(wordInfo.textNode, wordInfo.end);
  range.deleteContents();
  var newTextNode = document.createTextNode(suggestion);
  range.insertNode(newTextNode);
  editor.normalize();

  // 2. 光标移到新词末尾
  var selRange = document.createRange();
  selRange.setStartAfter(newTextNode);
  selRange.collapse(true);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(selRange);

  // 3. 记录修改历史（含 context 用于撤销）
  modificationHistory.push({
    oldWord: oldWord,
    newWord: suggestion,
    type: type,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    context: wordInfo.context
  });

  // 4. 更新 UI
  renderModHistory();
  updateModCount();
  closePopover();

  // 5. 持久化
  saveData();
}
```

**关键变化**：
- 参数从 `(idxStr, suggestion)` 改为 `(suggestion)` ——因为不再有 `aiAnnotations[idx]` 数组。
- `currentPopoverTarget` 是 ann 对象，从中取 `wordInfo`（含 textNode/start/end/context）。
- 不再操作任何 span。替换直接在文本节点级别进行。
- `modificationHistory` 每项新增 `context` 字段。

**注意**：由于 `acceptSuggestion` 参数变了，`showPopover` 中的 `onclick` 回调也需要改为 `acceptSuggestion('word')`（见 2.6 中已调整）。

同时修改 `addToHistory()` 函数（原 3167行）：参数从 `(idx, oldWord, newWord, type)` 改为内联逻辑（直接在 acceptSuggestion 中 push 到 modificationHistory），或保留 addToHistory 但移除 idx 参数。

### 2.8 重写 `undoModification(historyIdx)` （核心技术点）

无 span 模式下，撤销只能通过全文搜索 + context 匹配来定位被替换的词：

```javascript
function undoModification(historyIdx) {
  var entry = modificationHistory[historyIdx];
  if (!entry) return;

  var editor = document.getElementById('essay-editor');
  var walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  var node, found = false;
  var firstMatchNode = null, firstMatchStart = -1;

  // 遍历所有文本节点
  while ((node = walker.nextNode())) {
    var data = node.data;
    var idx = data.indexOf(entry.newWord);
    if (idx === -1) continue;

    // 优先匹配 context（取 newWord 前后 20 字符对比）
    var surrounding = data.substring(
      Math.max(0, idx - 20),
      Math.min(data.length, idx + entry.newWord.length + 20)
    );
    if (entry.context && surrounding.indexOf(entry.context.substring(0, 10)) !== -1) {
      // Context 匹配成功 → 精确定位
      var range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + entry.newWord.length);
      range.deleteContents();
      range.insertNode(document.createTextNode(entry.oldWord));
      editor.normalize();
      found = true;
      break;
    }

    // 记录第一个匹配位置（context 不匹配时的回退方案）
    if (firstMatchStart === -1) {
      firstMatchNode = node;
      firstMatchStart = idx;
    }
  }

  // 退而求其次：若 context 匹配失败，替换第一个匹配的 newWord
  if (!found && firstMatchNode) {
    var fallbackRange = document.createRange();
    fallbackRange.setStart(firstMatchNode, firstMatchStart);
    fallbackRange.setEnd(firstMatchNode, firstMatchStart + entry.newWord.length);
    fallbackRange.deleteContents();
    fallbackRange.insertNode(document.createTextNode(entry.oldWord));
    editor.normalize();
  }

  // 从历史中删除
  modificationHistory.splice(historyIdx, 1);
  renderModHistory();
  updateModCount();
  saveData();
}
```

**撤销策略说明**：
- **第一优先级**：用 `entry.context`（替换时记录的上下文片段）在编辑器中精确定位被替换词的位置。
- **第二优先级**：如果用户后来编辑了周围文字导致 context 不匹配，退而求其次替换全文第一个匹配的 `entry.newWord`。
- 尽管回退方案在极端情况下（用户自己输入了同一个词）可能找错位置，但在英语作文场景中（自然文本中同一个词多次出现时，context 通常能区分），这是无 span 模式下的最佳实践。

### 2.9 重写 `toggleAIAnnotations()`

```javascript
function toggleAIAnnotations() {
  aiAnnotationsOn = !aiAnnotationsOn;
  var track = document.getElementById('ai-toggle-track');
  var hint = document.getElementById('ai-toggle-hint');

  if (aiAnnotationsOn) {
    track.classList.add('on');
    hint.textContent = '标注已开启 · 点击词汇查看 AI 建议';
    hint.classList.add('active');
  } else {
    track.classList.remove('on');
    hint.textContent = '标注已关闭 · 开启后可点击词汇查看 AI 建议';
    hint.classList.remove('active');
    closePopover();
  }
  // 不再遍历 span 切换样式
}
```

**关键变化**：删除 `querySelectorAll('#essay-editor .ai-span-l1, #essay-editor .ai-span-l2')` 和遍历循环。开关仅控制 `aiAnnotationsOn` 布尔标志，`setupAnnotationClickHandlers` 中在开始时检查此标志。

### 2.10 删除旧代码

需要删除或注释掉以下内容：

1. **编辑器中的预插入 span**（1961、1963、1965、1967行）：将 `<span class="ai-span-l1" data-ai-word="good" data-ai-idx="0">good</span>` 替换为纯文本 `good`。即编辑器 innerHTML 从带 span 的版本变为纯文本版本。

   例如：`<span class="ai-span-l2" data-ai-word="brings" data-ai-idx="2">brings</span>` → `brings`

2. **硬编码 aiAnnotations 数组**（3015-3020行）：注释掉或删除。

3. **旧 CSS 规则**（如果存在 `.ai-span-l1`、`.ai-span-l2`、`.ai-span-new` 的样式定义）：可以保留（不影响功能），或删除（代码更干净）。推荐保留以避免改动过多 CSS。

### 2.11 页面关闭时清理 popover 全局监听

现有的全局 click 关闭 popover 逻辑（3125-3131行）中的判断条件需调整：

```javascript
document.addEventListener('click', function(e) {
  var popover = document.getElementById('ai-popover');
  if (!popover || popover.style.display === 'none') return;
  // 修改：不再用 e.target !== currentPopoverTarget（因为 currentPopoverTarget 不再是 DOM 元素）
  if (!popover.contains(e.target)) {
    closePopover();
  }
});
```

删除 `e.target !== currentPopoverTarget` 条件（因为 currentPopoverTarget 现在是纯 JavaScript 对象，不是 DOM 元素）。

---

## 三、验收标准

### 基础验收（必须全部通过）

- [ ] **刷新持久化 - 编辑器内容**：在编辑器中任意修改文字（打字、删除、粘贴），刷新页面后修改内容仍在。
- [ ] **刷新持久化 - AI 替换**：点击 "good" → 选择 "beneficial" 替换，刷新页面后编辑器显示 "beneficial"，修改历史列表保留该条记录。
- [ ] **刷新持久化 - Fork 计数**：点击 Fork 按钮 2 次，刷新页面后 Dashboard "我的作文"统计显示 14（12 + 2）。
- [ ] **点击靶词弹出 Popover**：在编辑器内点击 "good"、"very"、"brings" 等靶词，弹出 AI 建议气泡，显示词汇等级（L1/L2）、原因、建议词列表。
- [ ] **点击非靶词不弹 Popover**：点击 "the"、"is"、"in" 等普通词汇，不弹 Popover（控制台无报错）。
- [ ] **点击空白不弹 Popover**：点击编辑器内段落间的空白区域，不弹 Popover（控制台无报错）。
- [ ] **建议词替换**：点击 Popover 中的建议词（如 "beneficial"），原文中对应词被就地替换，修改历史更新。
- [ ] **撤销修改**：在右侧修改历史面板中点击某条记录的「撤销」按钮，编辑器中的词恢复为原词，该记录从历史列表移除。
- [ ] **AI 开关**：关闭「显示 AI 标注」开关后，点击 "good" 不弹 Popover；重新开启后恢复正常。
- [ ] **无 span 模式**：检查编辑器 DOM，确认内部没有任何 `ai-span-l1`、`ai-span-l2` class 的 span 元素。
- [ ] **控制台无报错**：刷新页面、切换页面、版本切换、点击靶词、替换词、撤销等操作均不产生错误。
- [ ] **版本切换正常**：刷新后版本药丸高亮状态与刷新前一致，恢复按钮禁用状态正确。

### 边界验收

- [ ] 编辑器初始内容中 "brings" 点击触发标注（词形变化覆盖）。
- [ ] 编辑器初始内容中 "creates" 点击触发标注（单词级，非短语级）。
- [ ] 同一靶词在文中出现多次（如两次 "good"），每次点击都正常弹出 Popover，替换其中一处不影响另一处。
- [ ] 替换后继续手动编辑该词，不影响 Popover 功能。
- [ ] localStorage 被清空（新用户首次打开）时，页面正常显示默认内容，不会报错。
- [ ] 原有切换页面（Dashboard / 编辑器 / 详情 / 广场 / 阅读）、Fork micro-interaction、PR 合并动画、版本切换与恢复功能均正常。

### 非目标（不需要做）

- ✗ 不需要持久化 versionArchive 的 v1-v4 版本内容。
- ✗ 不需要持久化协作者邀请列表、邀请码状态。
- ✗ 不需要实现跨 Tab/窗口的数据同步（单 Tab 场景即可）。
- ✗ 不需要处理 localStorage 容量溢出（英语作文文本远小于 5MB 上限）。

---

## 四、关键文件修改清单

为方便执行，汇总所有需要改动的代码位置：

| 行号 | 操作 | 内容 |
|---|---|---|
| 1961-1967 | 修改 | 编辑器 HTML：移除 4 个 `<span class="ai-span-...">` 标签，改为纯文本 |
| 2689-2712 | 修改 | handleFork：forkCount++ 后调用 saveData() |
| 2609-2643 | 修改 | restoreVersion：latestVersion 更新后调用 saveData() |
| 2730-2740 | 修改 | updateDashboardAfterFork：硬编码 12→13 改为 12→12+forkCount |
| 3015-3020 | 删除 | 硬编码 aiAnnotations 数组 |
| 3026-3052 | 重写 | toggleAIAnnotations：删除 span 遍历循环 |
| 3055-3067 | 重写 | setupAnnotationClickHandlers：改为 getWordAtPoint + 查词库 |
| 3070-3116 | 重写 | showPopover：参数改为 (ann, event)，定位改为 clientX/Y |
| 3124-3131 | 修改 | 全局 click 监听：移除 `e.target !== currentPopoverTarget` 条件 |
| 3134-3164 | 重写 | acceptSuggestion：参数改为 (suggestion)，用 Range API 替换 |
| 3167-3179 | 修改 | addToHistory：移除 idx 参数，新增 context 字段 |
| 3233-3255 | 重写 | undoModification：改为 TreeWalker + context 匹配 |
| 3263-3267 | 修改 | DOMContentLoaded 回调：新增 localStorage 恢复逻辑 |
| 新增 | 新增 | getWordAtPoint 函数、replaceWordInEditor 函数、saveData 函数、editor input 防抖监听、WORD_SUGGESTIONS 词库 |

## 数学自动补全与符号检测实现说明

本文详细说明本次实现的“击键触发自动补全 → 插入数学符号”的完整架构、代码位置、数据流，以及如何扩展到更多数学表达式乃至逐步替代 LaTeX。内容以新人工程师为对象，尽量解释所有术语与组件职责。

1. 总体目标与交互概览
在 BlockNote 编辑器中，用户每输入一个字母（如“alp”），在光标附近弹出一个建议列表（Popover）。
按 Enter/Tab 接受候选项后：
会将刚才输入的“alp”那一段文本删除，
在相同位置插入一个“数学符号内联节点”（如 α），并立即渲染为对应的 Unicode 符号。
当前已实现：希腊字母（alpha → α、beta → β …）。
架构已为未来扩展预留：你可以添加更多提供器（providers），支持函数、运算符、单位、模板等；也可以引入更强的预处理器/解析器。

2. 代码结构与关键文件
app/lib/blocknote-schema.ts
注册自定义 inline 节点 mathSymbol（在自定义 customSchema 中通过 inlineContentSpecs 引入）。
保留了原有 inlineMath（KaTeX LaTeX 渲染）以兼容。
app/components/product components/InlineMathSymbol.tsx
定义 mathSymbol 的渲染逻辑：显示 Unicode 字符，不带边框，不抢夺排版。
app/components/product components/useMathSuggest.tsx
核心 Hook：监听击键与选区，计算“当前单词 token”，查询建议，控制 Popover 开关，处理按键接受逻辑与替换。
app/components/product components/MathSuggestPopover.tsx
建议弹层 UI：紧贴光标下方、玻璃拟态（半透明、模糊）但走高性能路径（小 blur、contain、will-change、translateZ(0)）。
app/lib/math-dsl/suggestions.ts
建议数据源与检索：目前实现 getGreekSuggestions(prefix)，按“精确匹配 > 前缀 > 包含”的优先级排序，返回最多 8 个。
app/lib/math-dsl/utils.ts
提供 getGreekSymbol(keyword)（alpha→α 等）等辅助函数。
集成点（已接入）：
app/components/workspace components/PageEditor.tsx
app/components/workspace components/PageEditorModal.tsx
通过 useCreateBlockNote({ schema: customSchema }) 使用自定义 schema。
调用 useMathSuggest({ editor, enabled: true }) 启用击键建议，并在编辑器旁渲染 {Popover}。

3. 数据流与运行时行为（一步步）
1) 击键监听与取词
useMathSuggest 通过 keyup 与 selectionchange 事件读取当前选区（只处理“折叠选区”，即光标没有选中文字时）。
从选区的基础文本节点，按当前位置向左/右扫描 [a-zA-Z]，得到当前“单词 token”的起止位置与内容（例如 “alp”）。
2) 计算建议
调用 getGreekSuggestions(token) 返回候选列表（每项含 keyword 与 glyph）。
无候选时隐藏 Popover，有候选则打开 Popover 并计算锚点位置（光标矩形 DOMRect）。
3) Popover 定位与性能
位置策略：始终“在光标所在行下方”，并与光标水平位置对齐；若右侧溢出则向左回退；上下左右均做边界夹紧。
视觉效果：深色主题下半透明+轻度模糊（backdrop-filter）；浅色主题下纯白+轻阴影；使用 contain、will-change、translateZ(0) 提升性能，避免频繁重绘卡顿。
4) 接受建议（Enter/Tab）
再次定位当前 token（“alp”），构造一个 DOM Range：
删除该 Range 内容（相当于删掉“alp”）。
将光标折叠到 Range 起点。
调用 editor.insertInlineContent([{ type: 'mathSymbol', props: { token:'alpha', unicode:'α' } }])
BlockNote 会在当前光标位置插入一个 “mathSymbol” 内联节点。
渲染层 InlineMathSymbol 立刻显示为 α。
关闭 Popover。
5) 键盘导航与取消
ArrowUp/Down：切换高亮项。
Esc：关闭 Popover。
输入继续更新：继续查询新前缀，更新列表。

4. 组件与术语解释（给新手）
BlockNote：一个富文本编辑器内核，支持“块（block）”与“内联内容（inline content）”两种层级。
自定义 Inline 节点（inline content spec）：我们新增的 mathSymbol 就是一个内联节点类型，放在文本流中单字/短片段的位置。
Hook（React 钩子）：useMathSuggest 是一个自定义 Hook，管理状态（候选列表、是否打开、当前选中项等）和副作用（监听击键/选区变化、响应按键）。
Popover：贴在光标附近的建议列表 UI。
Token：这里指“当前输入的单词”，以 [a-zA-Z] 连续字符定义边界。

5. 设计权衡与性能
建议列表只在普通文本里触发：多节点选区、代码块、链接、IME（输入法组合）过程中会抑制。
Debounce：当前实现轻量化（依赖 keyup 和 selectionchange），如果后续数据源更重，可在 Hook 内加 30~50ms 防抖。
Popover 的模糊（blur）半径小而且容器使用 contain、will-change，对重绘友好；同时采用 position: fixed 避免滚动抖动。
列表项限制为 8 条，避免过长列表带来布局抖动。

6. 如何扩展到“超越希腊字母”，支持更多表达式甚至替代 LaTeX
这部分分三个层次，循序渐进：
层次 A：扩展“建议提供器”（最简单）
目标：继续保持“直接插入符号/模板”的工作流。
操作：
在 app/lib/math-dsl/suggestions.ts 新增 provider（例如 functionProvider、operatorProvider、unitProvider）。
每个 provider 提供 trigger(word) 与 suggestions(word)，或者像现在一样导出 getXxxSuggestions。
在 useMathSuggest 中将 getGreekSuggestions(token) 替换为“并行合并多个 provider 结果”，再做统一排序（精确 > 前缀 > 模糊）。
对于需要参数的模板（如分数、根号），可先插入一个“模板内联节点”或“带占位符的文本”，并把光标放到第一个占位符位置（后续你可扩展 mathSymbol 或新增 mathTemplate）。
例子：
输入 sqrt → 候选为 “√x”，接受后插入 √( )，光标置于括号内。
输入 sum → 候选为 “∑”，接受后插入 ∑_{ }^{ } ( ) 模板，光标在下限，Enter → 上限，Enter → 表达式。
优点：实现快、风险小，保持当前轻量化链路。
不足：表达式语义不够强，复杂公式编辑体验有上限。
层次 B：预处理 + KaTeX（中等复杂度）
目标：仍以保存/渲染 LaTeX 为主，但输入层面允许更自然的语法。
操作：
继续使用现有 preprocessor.ts “简化语法 → LaTeX” 的思路（现在已支持 x/y 自动转 \frac{x}{y}、希腊名词自动加反斜线）。
在 InlineMath（LaTeX 节点）或新的“数学编辑模式”里，输入内容先过预处理：把“用户友好语法”转成标准 LaTeX，再交给 KaTeX 渲染。
同时保留建议系统，让用户能直接插入 LaTeX 函数模板（如 \sum_{i=1}^{n} x_i 的骨架）。
逐步替代路径：
你可以在 preprocessor.ts 持续加入新规则（指数、下标、根式、极限、积分、矩阵等）。
对每条规则写单元测试，确保不会误伤 URL、路径、代码片段等。层次 C：自研 DSL/解析器 + 渲染（高级路线）
目标：完全抛开 LaTeX，建立自己的数学 DSL（词法分析 Lexer → 语法分析 Parser → AST → 渲染器）。
状态：你项目已有 lexer.ts / parser.ts / renderer.tsx 的基础设施与类型定义（types.ts），早期已实现过一版。
操作：
把“击键建议 + 模板插入”作为输入辅助；
文本层存储为“你的 DSL 源码”，渲染层通过解析器生成 AST，再渲染为 React/MathML（或 SVG/HTML）。
优化：增量解析（只重算受影响的子树）、逐节点渲染（虚拟化）、复杂度削峰。
优点：完全掌控输入/渲染规则，可设计出“类 Typst”般简洁的语法与语义行为（光标跳位、模板序列、IME 协作）。
成本：工程量较大，需要严格的测试与性能优化。
建议的演进路径：A → B → C，先把“建议 + 模板 + 预处理”打磨得非常顺手，再逐步迁移到 DSL。

7. 你需要改的最少代码（扩展指南）
增加新建议源（以运算符为例）：
在 suggestions.ts 新增：
const OPERATORS = [{ keyword: 'times', display: '×' }, ...]
export function getOperatorSuggestions(prefix) { /* 同 Greek 的匹配方式 */ }
在 useMathSuggest.tsx：
把 getGreekSuggestions(token) 换成合并：[...getGreekSuggestions(token), ...getOperatorSuggestions(token)]。
排序规则保持“精确 > 前缀 > 包含”，并去重。
插入模板（如分数）：
为模板新增一个 inline 节点 mathTemplate（类似 InlineMathSymbol），props 含“模板类型、槽位”等；
接受建议时插入 mathTemplate，并立即将光标放到第一个槽位文本节点（需要在 Hook 里扩展“插入后定位槽位”的逻辑）。
预处理增强：
在 preprocessor.ts 为更多模式写正则与边界判断（务必做单元测试）。
在 __tests__/math-dsl/preprocessor.test.ts 添加测试样例。

8. 可视与无障碍（A11y）
Popover 使用 role="listbox" 和 role="option"，aria-activedescendant 指向当前高亮项。
Esc 关闭、上下键切换，Enter/Tab 接受。
颜色与透明度在深浅主题下自动适配，保持可读性。

9. 常见问题与排查
“按 Enter 没有替换掉原始输入”：确认 useMathSuggest 的删除逻辑是否能获得正确的文本节点与选区（有些情况下 BlockNote 的文本可能被拆分到多个节点，必要时从 editor API 获取当前位置并走编辑器级替换）。
“Popover 位置不贴光标/抖动”：检查是否在移动端或高 DPI 下；可以在 useLayoutEffect 中增加一次 requestAnimationFrame 延迟再读取尺寸。
“模糊导致卡顿”：可降低 blur 半径（如 6px→4px），或在低端设备关闭 blur（用纯色透明背景代替）。

10. 术语小词典（中文解释）
Inline Node（内联节点）：和普通文字混排的小组件（如一个符号、一个图标），不是独占一行的大块（Block）。
Provider（建议提供器）：根据当前输入前缀给出候选建议的“数据源模块”，例如希腊字母提供器、函数提供器等。
Token（词元/单词）：本实现中指“由字母组成的连续片段”，比如 “alp”。
Popover（弹出层）：贴着光标显示的建议列表小浮层。
Preprocessor（预处理器）：把“简化输入”转换成“标准形式”（如把 x/y 转为 \\frac{x}{y}）。

11. 小结
你现在已经有了“击键触发 → 建议 → Enter 替换为符号”的完整链路，且 UI 在光标下方、半透明玻璃风格且高性能。
架构层面非常容易拓展：新增 provider 就能扩充建议；引入模板节点即可支持复杂结构；若要替代 LaTeX，可逐步过渡到“预处理 + KaTeX”与“自研 DSL”两条路线，按需推进。
如果你愿意，我可以帮你：
加入“函数/运算符/单位”的建议与模板；
扩展 preprocessor.ts 规则（例如指数、矩阵、极限、积分）；
或者设计并实现下一步的 DSL 版本（词法/语法/AST/渲染与增量解析）。
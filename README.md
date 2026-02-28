# RemiVibeTarot

Demo: https://service.remiki.ren/RemiVibeTarot

## 概述
纯前端的塔罗牌洗牌工具。每次洗牌会随机选出 3 张牌，并生成一个包含牌面信息的 prompt，方便用户将其输入到其他 AI 模型中进行解读。

## 使用方式

- 直接双击打开 `index.html`
- 点击「洗牌并开始」
- 在牌堆里点选 3 张牌
- 在「出牌结果」里点「复制解读 Prompt」，把文本粘贴给其他 AI 解读

> 说明：洗牌时会同时为每张牌确定「正位/逆位」，并在结果与 prompt 中体现。

## 文件

- `index.html` 页面
- `style.css` 样式
- `app.js` 逻辑（洗牌固定映射、点选三张、生成/复制 prompt）

## 警告
Vibe Coding

## 授权
WTFPL

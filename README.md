## PontaのLPコーディングテンプレを作るぞ

## マニュアル

### 1. ローカルに落とす
```
$ npm install .
```

### 2. 今回作成するLPの書き出し
```
$ node generate.js

💡 利用可能なセクション一覧:
<!-- TODO: section作成中 -->
mainVisual_A, mainVisual_B, grid_A, grid_B, detail_A, detail_B

📝 ページタイトルを入力してください（例: 春のキャンペーン）: <!-- 今回のタイトル入力 -->

✅ 使いたいセクションIDをカンマで入力してください（例: mainVisual_A, grid_B）:　<!-- 利用可能なセクション一覧からsection選択 -->

```
上記が完了したらdistに書き出されるのでdist以下を使用してLP作成します
(現状は`index.html`と`styled.css`のみで`images`と`js`はLP作成時に追加してく感じで運用予定)
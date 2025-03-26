const fs = require('fs');
const path = require('path');
const readline = require('readline');
const cheerio = require('cheerio');
const prettier = require('prettier');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const html = fs.readFileSync('./sample.html', 'utf-8');
  const $ = cheerio.load(html);

  // セクションID一覧取得
  const allSectionIds = [];
  $('body')
    .children()
    .each((_, el) => {
      const id = $(el).attr('id');
      if (id) allSectionIds.push(id);
    });

  console.log('\n💡 利用可能なセクション一覧:');
  console.log(allSectionIds.join(', '));

  rl.question('\n📝 ページタイトルを入力してください（例: 春のキャンペーン）: ', (title) => {
    rl.question(
      '\n✅ 使いたいセクションIDをカンマで入力してください（例: mainVisual_A, grid_B）: ',
      async (input) => {
        const selectedIds = input.split(',').map((id) => id.trim());
        const newDoc = cheerio.load(
          '<html><head></head><body><div class="container"></div></body></html>',
        );

        const originalHead = $('head').clone();
        originalHead.find('title').remove();
        originalHead.find('link[href="styled.css"]').remove();
        originalHead.append(`<title>${title}</title>`);
        originalHead.append(`<link rel="stylesheet" href="./styled.css">`);
        newDoc('head').replaceWith(originalHead);

        let classSet = new Set();
        let imageSet = new Set();

        selectedIds.forEach((id) => {
          const section = $(`#${id}`);
          if (section.length) {
            newDoc('.container').append(section.clone());

            const rootClass = section.attr('class');
            if (rootClass) {
              rootClass.split(/\s+/).forEach((cls) => classSet.add(cls));
            }

            section.find('[class]').each((_, el) => {
              const classes = ($(el).attr('class') || '').split(/\s+/);
              classes.forEach((cls) => classSet.add(cls));
            });

            section.find('img').each((_, img) => {
              const src = $(img).attr('src');
              if (src && src.startsWith('images/')) {
                imageSet.add(src);
              }
            });
          } else {
            console.warn(`⚠️ セクションID "${id}" は見つかりませんでした`);
          }
        });

        const baseCSS = `
          html {
            scroll-behavior: smooth;
            font-size: 62.5%;
          }

          body {
            max-width: 600px;
            margin: 0 auto;
            font-family: "A P-OTF Shin Maru Go Pr6N", "M PLUS Rounded 1c", sans-serif;
            background-color: #fff;
            font-style: normal;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          img {
            width: 100%;
            height: auto;
            display: block;
          }

          a {
            text-decoration: none;
            color: inherit;
          }
        `;

        const cssPath = './styled.css';
        let filteredCSS = '';
        if (fs.existsSync(cssPath)) {
          const cssContent = fs.readFileSync(cssPath, 'utf-8');
          classSet.forEach((cls) => {
            const regex = new RegExp(`\\.${cls}(\\s+[^{]+)?\\s*\\{[\\s\\S]*?\\}`, 'g');
            const matches = cssContent.match(regex);
            if (matches) {
              filteredCSS += matches.join('\n\n') + '\n\n';
            }
          });
        }

        const distDir = './dist';
        const imagesDir = path.join(distDir, 'images');
        const jsDir = path.join(distDir, 'js');

        if (fs.existsSync(distDir)) {
          fs.rmSync(distDir, { recursive: true });
        }
        fs.mkdirSync(distDir);
        fs.mkdirSync(imagesDir);
        fs.mkdirSync(jsDir);

        // 使用された画像をコピー
        imageSet.forEach((relativePath) => {
          const srcPath = path.join('./', relativePath);
          const destPath = path.join('./dist/', relativePath);
          const destDir = path.dirname(destPath);

          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }

          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`🖼 画像コピー: ${relativePath}`);
          } else {
            console.warn(`⚠️ 画像が見つかりません: ${srcPath}`);
          }
        });

        const finalCSS = baseCSS + '\n\n' + (filteredCSS || '/* styled.css is empty */');
        fs.writeFileSync(path.join(distDir, './styled.css'), finalCSS, 'utf-8');

        const prettyHtml = await prettier.format(newDoc.html(), { parser: 'html' });
        const finalHtml = '<!DOCTYPE html>\n' + prettyHtml.replace(/<!doctype html>\n?/i, '');
        fs.writeFileSync(path.join(distDir, 'index.html'), finalHtml, 'utf-8');

        console.log(`\n✅ dist/index.html を整形して出力しました`);
        console.log(`🎨 styled.css に共通CSS + 使用セクションのCSSを出力しました`);
        rl.close();
      },
    );
  });
}

main();

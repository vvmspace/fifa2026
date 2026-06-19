const fs = require("fs");
const path = require("path");

/**
 * Проверяет наличие страницы в файловой системе.
 * @param {string} rootPath - Корень сайта
 * @param {string} currentFileDir - Директория текущего файла
 * @param {string} relativePath - Ссылка из href
 */
function checkPageExists(rootPath, currentFileDir, relativePath) {
  let fullPath;

  if (relativePath.startsWith("/")) {
    fullPath = path.join(rootPath, relativePath);
  } else {
    fullPath = path.join(currentFileDir, relativePath);
  }

  // Нормализуем путь (убираем лишние .. и .)
  fullPath = path.normalize(fullPath);

  if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
    return true;
  }

  // Если это директория, проверяем index.html
  if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
    const indexPath = path.join(fullPath, "index.html");
    return fs.existsSync(indexPath);
  }

  // Пробуем добавить index.html если путь заканчивается на /
  if (relativePath.endsWith("/")) {
    const indexPath = path.join(fullPath, "index.html");
    return fs.existsSync(indexPath);
  }

  // Пробуем добавить .html если файл не найден
  if (!relativePath.endsWith(".html")) {
    const htmlPath = fullPath + ".html";
    return fs.existsSync(htmlPath);
  }

  return false;
}

function getAllHtmlFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllHtmlFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".html")) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function checkLinksInSite(siteFolderName) {
  const rootPath = path.join(__dirname, "landings", siteFolderName);
  if (!fs.existsSync(rootPath)) {
    console.error(
      `Ошибка: Директория сайта ${siteFolderName} не найдена по пути ${rootPath}`,
    );
    return;
  }

  console.log(`\n--- Проверка ссылок для сайта: ${siteFolderName} ---`);
  const htmlFiles = getAllHtmlFiles(rootPath);
  let totalLinks = 0;
  let brokenLinks = 0;

  htmlFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const currentFileDir = path.dirname(filePath);
    // Регулярное выражение для поиска href="..." или href='...'
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match;

    while ((match = hrefRegex.exec(content)) !== null) {
      const link = match[1];

      // Пропускаем внешние ссылки, якоря, спец. ссылки и CSS
      if (
        link.startsWith("http") ||
        link.startsWith("#") ||
        link.startsWith("mailto:") ||
        link.startsWith("tel:") ||
        link.endsWith(".css")
      ) {
        continue;
      }

      totalLinks++;
      if (!checkPageExists(rootPath, currentFileDir, link)) {
        console.log(
          `❌ Битая ссылка: ${link} \n   в файле: ${path.relative(rootPath, filePath)}`,
        );
        brokenLinks++;
      }
    }
  });

  console.log(
    `Результат для ${siteFolderName}: Проверено ссылок: ${totalLinks}, Битых: ${brokenLinks}`,
  );
}

// Запуск для обоих сайтов
const sites = ["boletosfifa.store", "copa26.store"];
sites.forEach(checkLinksInSite);

const fs = require('fs');
const path = require('path');

// Directorios de archivos desde donde va a buscar los archivos el proyecto tiene estas carpetas: webShinChan(parte servidor)/PUBLIC(parte "front")/(html/, css/, js/, json/, etc.)/subcarpetas...
const publicDir = path.join(__dirname, 'PUBLIC');
const cssBaseDir = path.join(publicDir, 'css', 'base', 'Body');
const cssResponsiveDir = path.join(publicDir, 'css', 'responsive', 'Body');
const cssVariablesDir = path.join(publicDir, 'css', 'variables');

// Resultado final, lo que vamos a guardar en el JSON
let result = { 
css: {},
variables: []
};

// Función para obtener todos los archivos CSS de un directorio y subdirectorios (basicamente si no hay mas archivos css, busca en los subdirectorios)
function getAllCSSFiles(dir, relativeTo) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getAllCSSFiles(fullPath, relativeTo));
    } else if (file.endsWith('.css')) {
      const relativePath = path.relative(relativeTo, fullPath).replace(/\\/g, '/');
      results.push({ name: path.parse(file).name, fullPath, relativePath });
    }
  }

  return results;
}

// Función para buscar un archivo responsive CSS por nombre, ya que el nombre del archivo es el mismo que el base pero con un sufijo de dispositivo (ej: EI_AP_Administracion.css --> EI_AP_Administracion_Desktop.css)
function findResponsiveFile(dir, targetFile) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const found = findResponsiveFile(fullPath, targetFile);
      if (found) return found;
    } else if (file === targetFile) {
      return fullPath;
    }
  }

  return null;
}

// Escanear base + responsive CSS
function scanCSS() {
  const baseFiles = getAllCSSFiles(cssBaseDir, publicDir);

  baseFiles.forEach(({ name, relativePath }) => {
    const cssEntry = {
      path: relativePath,
      Desktop: null,
      Tablet: null,
      Mobile: null
    };

    // Buscar archivos responsive CSS y los añade al objeto cssEntry
    ['Desktop', 'Tablet', 'Mobile'].forEach((device) => {
      const responsiveFile = `${name}_${device}.css`;
      const responsiveFilePath = findResponsiveFile(cssResponsiveDir, responsiveFile);

      if (responsiveFilePath) {
        cssEntry[device] = path.relative(publicDir, responsiveFilePath).replace(/\\/g, '/');
      }
    });

    result.css[name] = cssEntry;
    console.log(`👍 Encontrado base CSS: ${relativePath}`);
  });
}

// Escanear archivos de variables CSS
function scanVariableFiles() {
  const variableFiles = getAllCSSFiles(cssVariablesDir, publicDir);
  result.variables = variableFiles.map(f => f.relativePath);
}

// Ejecutar
scanCSS();
scanVariableFiles();

// Guardar JSON (recordad que publicDir es la carpeta donde se situa el proyecto, yo lo tengo en PUBLIC)
fs.writeFileSync(
  path.join(publicDir, 'json', 'paths.json'), //public/json/paths.json, writeFileSync, os crea el archivo si no existe, pero si existe lo sobreescribe (super util)
  JSON.stringify(result, null, 2)
);

console.log('🫶 JSON generado con éxito');

/*
El JSON generado tiene la siguiente estructura:
{
  // css se guarda como un objeto con las claves de los nombres de los archivos CSS base
  "css": {
    "EI_AP_Administracion": {
      "path": "css/base/Body/Area_Profesional/Admin/EI_AP_Administracion.css",
      "Desktop": null,
      "Tablet": null,
      "Mobile": null
    }
  }
    // variables se guarda como un array con las rutas de los archivos CSS de variables
    "variables": [
      "css/variables/variables.css",
      "css/variables/variables2.css"
    ]
}
*/

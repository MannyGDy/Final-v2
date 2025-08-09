import fs from 'node:fs';
import path from 'node:path';

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copy(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

const root = path.resolve(process.cwd());
const nm = path.join(root, 'node_modules');
const webVendor = path.resolve(root, '../web/vendor');

ensureDir(webVendor);

// Bootstrap
copy(path.join(nm, 'bootstrap/dist/css/bootstrap.min.css'), path.join(webVendor, 'bootstrap/bootstrap.min.css'));
copy(path.join(nm, 'bootstrap/dist/js/bootstrap.bundle.min.js'), path.join(webVendor, 'bootstrap/bootstrap.bundle.min.js'));

// Chart.js
copy(path.join(nm, 'chart.js/dist/chart.umd.js'), path.join(webVendor, 'chart.js/chart.umd.js'));

console.log('Local vendor assets prepared in web/vendor');



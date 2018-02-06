const express = require('express');
const postcss = require('postcss');
const cssnano = require('cssnano');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const util = require('util');
const fs = require('fs');

const readFile = util.promisify(fs.readFile);
const app = express();

// create application/json parser
const jsonParser = bodyParser.json({
  limit: '1mb',
});

const options = {};
app.use(compression());
app.use(helmet({
  dnsPrefetchControl: false,
  ieNoOpen: false,
}));
app.use(express.static('public', options));
app.set('view engine', 'pug');

function getSiteCss() {
  return Promise.all([
    readFile('./src/style.css', 'utf8'),
    readFile('./node_modules/codemirror/lib/codemirror.css', 'utf8'),
  ]).then(files => files.reduce((css, fileText) => css + fileText, ''));
}

function minify(css, preset = 'default', filename = undefined) {
  return postcss([
    cssnano({
      preset: [preset],
    }),
  ]).process(css, {
    from: filename,
    to: filename,
  });
}

function getInlineCss() {
  return getSiteCss()
    .then(css => minify(css))
    .then(result => result.css);
}

const inlineCss = getInlineCss();

app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    inlineCss.then((css) => {
      res.render('index.pug', { inlineCss: css });
    });
  } else {
    getSiteCss().then((css) => {
      res.render('index.pug', { inlineCss: css });
    });
  }
});

app.post('/api', jsonParser, (req, res) => {
  const { name, text, preset } = req.body;

  if (!text) {
    return res.status(400).json({
      error: {
        name: 'Oops',
        reason: 'Missing `text` field in request body.',
      },
    });
  }

  return minify(text, preset, name).then((result) => {
    res.json({
      text: result.css,
      map: result.map,
    });
  }, (err) => {
    res.status(400).json({
      error: {
        name: err.name,
        reason: err.reason,
      },
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('listening on port:', port);
});

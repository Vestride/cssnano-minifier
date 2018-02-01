const express = require('express');
const postcss = require('postcss');
const cssnano = require('cssnano');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');

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

app.get('/', (req, res) => {
  res.render('index.pug');
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

  return postcss([
    cssnano({
      preset: [preset],
    }),
  ]).process(text, {
    from: name,
    to: name,
  }).then((result) => {
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

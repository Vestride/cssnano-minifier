import type { VercelRequest, VercelResponse } from '@vercel/node';
import postcss from 'postcss';
import cssnano from 'cssnano';

function minify(css: string, preset = 'default', filename = undefined) {
  const plugins = [cssnano({ preset })];
  return postcss(plugins).process(css, {
    from: filename,
    to: filename,
  });
}

export default async (request: VercelRequest, response: VercelResponse) => {
  const { name, text, preset } = request.body;

  if (!text) {
    return response.status(400).json({
      error: {
        name: 'Oops',
        reason: 'Missing `text` field in request body.',
      },
    });
  }

  try {
    const result = await minify(text, preset, name);
    response.json({
      text: result.css,
      map: result.map,
    });
  } catch (error) {
    response.status(400).json({
      error: {
        name: error.name,
        reason: error.rason,
      },
    });
  }
};

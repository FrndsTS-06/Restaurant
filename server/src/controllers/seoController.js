const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const { CLIENT_URL } = require('../config/env');

// @desc    Generate dynamic XML sitemap
// @route   GET /sitemap.xml
const getSitemapXml = async (req, res, next) => {
  try {
    const baseUrl = CLIENT_URL || 'http://localhost:5173';
    const dishes = await MenuItem.find({ isArchived: false }).select('_id slug updatedAt');
    const categories = await Category.find({ isActive: true }).select('slug updatedAt');

    const staticUrls = [
      { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${baseUrl}/menu`, changefreq: 'daily', priority: '0.9' },
      { loc: `${baseUrl}/about`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${baseUrl}/reservations`, changefreq: 'daily', priority: '0.9' },
      { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${baseUrl}/privacy`, changefreq: 'monthly', priority: '0.3' },
      { loc: `${baseUrl}/terms`, changefreq: 'monthly', priority: '0.3' }
    ];

    const categoryUrls = categories.map(cat => ({
      loc: `${baseUrl}/menu?category=${encodeURIComponent(cat.slug)}`,
      changefreq: 'weekly',
      priority: '0.8'
    }));

    const dishUrls = dishes.map(dish => ({
      loc: `${baseUrl}/menu/${dish._id}`,
      changefreq: 'weekly',
      priority: '0.7'
    }));

    const allUrls = [...staticUrls, ...categoryUrls, ...dishUrls];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    allUrls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${url.loc}</loc>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate search engine robots.txt
// @route   GET /robots.txt
const getRobotsTxt = (req, res) => {
  const baseUrl = CLIENT_URL || 'http://localhost:5173';
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Allow: /menu',
    'Allow: /about',
    'Allow: /contact',
    'Allow: /reservations',
    'Allow: /privacy',
    'Allow: /terms',
    'Disallow: /admin',
    'Disallow: /admin/*',
    'Disallow: /api/',
    'Disallow: /api/*',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`
  ].join('\n');

  res.header('Content-Type', 'text/plain');
  return res.status(200).send(robots);
};

module.exports = {
  getSitemapXml,
  getRobotsTxt
};

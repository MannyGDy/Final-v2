export function allowLocalStatic(req, res, next) {
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
}


